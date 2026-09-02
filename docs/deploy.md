# Deploy this backend

This repo is the **API platform** for a shop, not the website. You deploy it so a frontend (or Postman, or a mobile app) has somewhere real to log in, list products, hold a cart, and place orders.

Local `nx serve` on five ports is for development. Interviewers will ask what production looks like — this file is that answer.

## Why deploy the backend at all

- The UI cannot keep carts, passwords, or stock in the browser. Those need APIs, a database, and auth.
- Microservices only pay off if they run as **separate processes** with their own env, health checks, and scale settings (inventory might need more consumers than user-service).
- RabbitMQ and Mongo must be **always-on** infrastructure. Apps connect to them; they are not “part of React.”
- HTTPS, real secrets, and a pinned `CORS_ORIGIN` only exist once this is off `localhost`.

You do **not** have to deploy a frontend to demo the backend (Postman is enough). You **do** have to deploy the backend before a real SPA can leave localhost.

## What “done” looks like in production

```
  Users
    │  HTTPS
    ▼
  CDN / static host     ← frontend (separate repo)  see docs/frontend.md
    │  same-site or CORS + cookies
    ▼
  API gateway / ingress  ← ONE public host, e.g. api.example.com
    │  /users → user-service
    │  /products → product-service
    │  /inventory → inventory-service
    │  /carts → cart-service
    │  /orders → order-service
    ▼
  Five Nest services (containers or pods)
    │
    ├─ MongoDB (five databases, or five clusters later)
    └─ RabbitMQ (one cluster, exchange `core-platform`)
```

Locally the frontend would call `localhost:3000`…`3004`. **That does not scale for cookies and CORS.** In production put a **gateway** so the browser sees one origin (`https://api.example.com`) and cookies work with `SameSite=Lax`. Path prefix can stay `/api` as today.

## What you need to do (checklist)

1. **Containerize each Nest app**  
   Multi-stage Docker image: `npx nx build <service>` → run `node dist/main.js`. One image per service (or one image, different `PORT` / command). Do not put Mongo/Rabbit inside the app image.

2. **Run Mongo and Rabbit as managed services**  
   Atlas / Compose Mongo, CloudAMQP / Amazon MQ / in-cluster Rabbit. Persistent volumes. Do not use the local `docker-compose.yml` guest/guest in production.

3. **Secrets**  
   `JWT_SECRET` and `JWT_REFRESH_SECRET` ≥ 32 chars, **same `JWT_SECRET` on every service**. `MONGO_URI` and `RABBITMQ_URL` per environment. Inject via the platform (not git). Set `NODE_ENV=production`.

4. **Cookies and HTTPS**  
   `COOKIE_SECURE=true`. Terminate TLS at the gateway. Without HTTPS, Secure cookies will not be stored.

5. **CORS**  
   `CORS_ORIGIN=https://your-frontend.example.com` (comma-separated if you have a preview URL). Production **refuses** `*`.

6. **Gateway routes**  
   Forward `/api/users`, `/api/auth` → user-service; `/api/products` → product; etc. Preserve `Authorization`, `Cookie`, `X-CSRF-Token`, `X-Auth-Response`. Enable sticky nothing required (JWT is stateless).

7. **Health**  
   Liveness: `GET /api/health/live`. Readiness: `GET /api/health/ready` (Mongo + Rabbit). Use these for k8s probes / load balancer.

8. **Start order**  
   Mongo + Rabbit healthy first. Then all five apps. Inventory should be up before product-service emits `product.created` (or the message waits in the queue — still start inventory promptly).

9. **Scale**  
   Stateless Nest replicas behind the gateway. Rabbit consumers: durable queues already; more inventory replicas compete on the same queue (competing consumers). Do not share one Mongo collection across services.

10. **Observability (say it even if not built)**  
    Central logs, request id, Rabbit DLQ alerts (`core-platform.dlq`), disk for Mongo. This repo does not include Datadog/Prometheus yet.

## What you do *not* deploy from this repo

- A React/Vue/Next app — [docs/frontend.md](frontend.md)
- A payment provider (Stripe, etc.)
- Kubernetes manifests / Terraform — not in the tree; you would add them when you pick a cloud

`docker-compose.yml` here is **only** local Mongo + Rabbit. Apps still run with Nx on your machine until you add app Dockerfiles.

## Minimal cloud sketch (talk track)

**Cheap demo:** one VM or Railway/Render-style service **per** Nest app + Atlas + CloudAMQP + a small reverse proxy (Caddy/Nginx) for `api.` host.

**Job-like answer:** EKS/GKE/AKS, Ingress, one Deployment per service, Secrets, HPA on CPU, RabbitMQ operator or managed broker, Mongo Atlas peering.

**Why five processes cost more than a monolith:** more ops. You accept that to show isolation. If the interviewer pushes back, agree a modular monolith is the right first production step, and this layout is the split you’d grow into.

## Env that must change vs local

| Local | Production |
|---|---|
| `COOKIE_SECURE=false` | `true` |
| `CORS_ORIGIN` localhost list | Real frontend origin |
| Short demo JWT secrets | Random 32+ chars |
| `localhost` Mongo/Rabbit | Managed URIs |
| Five public ports | One HTTPS hostname via gateway |

## After deploy: prove it

- `https://api.example.com/api/health/ready` on each service (or through the gateway paths)
- Register + login from the real frontend origin (cookies `Secure` + CORS)
- Create product → inventory row appears (Rabbit)
- Place order → `reserved` increases

If cookies fail, first suspects: mixed HTTP/HTTPS, wrong `CORS_ORIGIN`, gateway stripping `Set-Cookie`, or frontend not using `credentials: 'include'`.
