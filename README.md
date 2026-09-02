# Core Platform

Nx + NestJS **e-commerce backend** (microservices). Built to show a full-stack interviewer how a shop API is split, secured, and wired — not a UI. The browser app is a **separate frontend**; this repo is the HTTP + events layer those screens call.

**One sentence:** a customer browses a public catalog, logs in, fills a cart, and places an order; stock updates asynchronously over RabbitMQ; each service owns its own Mongo database.

| You are asked… | Read |
|---|---|
| What is this / how does the stack fit together | This file |
| Auth, cookies, CSRF, tokens | [docs/auth.md](docs/auth.md) |
| Why RabbitMQ, which events | [docs/rabbitmq.md](docs/rabbitmq.md) |
| What the **frontend** must implement | [docs/frontend.md](docs/frontend.md) |
| **Why and how to deploy** this backend | [docs/deploy.md](docs/deploy.md) |
| Shared Nest library | [docs/common.md](docs/common.md) |
| Try the APIs | [docs/postman.md](docs/postman.md) |

## What to say in an interview

**Problem.** A store needs users, products, stock, cart, and orders. If that is one monolith, every change and every outage shares one process and one database. Here each capability is its own Nest app so you can scale, fail, and deploy them independently — the same idea as “bounded contexts.”

**Public vs private.** Anyone can **read** the catalog (like Amazon). Cart, checkout, profile, and **writes** need a logged-in user. User id always comes from the JWT (`sub`), never from the client body — so you cannot checkout as someone else by posting their id.

**Sync vs async.** The browser talks **HTTP**. Services do **not** HTTP-call each other to reserve stock. After an order is saved, `order.created` goes to RabbitMQ; inventory consumes it and reserves. If inventory is down, the message waits (queue + DLQ). That is the standard “don’t couple checkout to stock over REST” answer.

**Auth.** Short access JWT (~15m) + long refresh (~7d). Browser: HttpOnly cookies + CSRF header (session-cookie style). Postman/mobile: `Authorization: Bearer` and `X-Auth-Response: tokens`. Refresh **rotates**. Logout kills refresh, not access (access dies at `exp`). Passwords are bcrypt; refresh is stored as a hash.

**What this is not.** There is no React app in this repo, no payment provider, no API gateway in local Docker. Locally you run five ports. In production you put a gateway in front (see [docs/deploy.md](docs/deploy.md)).

## Architecture

```
                         Browser / Postman / mobile
                                    │  HTTP
                    ┌───────────────┼───────────────┐
                    │               │               │  (prod: one gateway)
           ┌────────┴──┐     ┌──────┴─────┐  ┌──────┴─────┐
           │ user :3000│     │product:3001│  │ … cart,    │
           │           │     │            │  │ inventory, │
           │           │     │            │  │ orders     │
           └─────┬─────┘     └─────┬──────┘  └──────┬─────┘
                 │                 │                │
                 └────────┬────────┴────────┬───────┘
                          │                 │
                     MongoDB :27017    RabbitMQ :5672
                     one DB per service  exchange `core-platform`
```

| App | Port | Mongo DB | Owns | Typical UI screen |
|---|---|---|---|---|
| `user-service` | 3000 | `users` | Account, login, tokens | Sign in, profile |
| `product-service` | 3001 | `products` | Catalog | Home, PDP |
| `inventory-service` | 3002 | `inventory` | Quantity / reserved | “In stock” on PDP |
| `cart-service` | 3003 | `carts` | That user’s cart | Cart drawer |
| `order-service` | 3004 | `orders` | That user’s orders | Checkout, order history |

Nx project names = folder names (`npx nx serve user-service`). Shared library: `@core-platform/common` (boot, JWT guard, Mongo helpers, Rabbit). Services **do not** share collections.

```
  Request
    │  Bearer access  or  cookie access_token  (+ CSRF on cookie writes)
    ▼
  JwtAuthGuard  →  401 / 403  or  controller
    │
    ├─ read/write this service’s Mongo
    └─ some writes: publish event → inventory (or nobody yet)
```

## Full-stack user journey

This is the story to walk on a whiteboard.

1. **Landing.** `GET /api/products` (public). Optional `GET /api/inventory/:productId` for stock. No login.
2. **Register / login.** `POST /api/users` or `POST /api/auth/login` on user-service. Browser stores **nothing** in `localStorage`. Cookies are set. SPA reads `csrf_token` (not HttpOnly) for later writes.
3. **Session.** `GET /api/users/me` to show the header avatar. Access lasts ~15m.
4. **Add to cart.** `POST /api/carts/items` with product id and qty. `userId` is `token.sub`.
5. **Checkout.** `POST /api/orders` with line items. Order service saves the order, publishes `order.created`. Inventory **reserves** stock. UI should not assume stock is reserved in the same HTTP response from orders — it is eventual (usually milliseconds).
6. **Access expired.** Any 401 on a protected call → `POST /api/auth/refresh` (cookie or body) → retry. New refresh token; **save it** if you use Bearer.
7. **Logout.** `POST /api/auth/logout`. Refresh is dead. Access Bearer may work until expiry. Cookies cleared.

Cancel order → `order.cancelled` → inventory **releases** reserved qty. New product → `product.created` → inventory row at quantity `0` (admin then PUTs stock).

`user.created` / `user.updated` are published but **have no consumer yet** (honest answer: ready for email/CRM later).

## Why these design choices (expect these questions)

**Why microservices, not one Nest app?**  
To show service boundaries, separate data stores, and async integration. For a two-person shop a modular monolith is often enough — say that. This project is the “how I’d split it when the team and traffic grow” version.

**Why Mongo per service?**  
Database-per-service: no join across users and orders in one query. The UI joins in the client or later via a BFF/gateway. Duplicate product name on an order line is OK (snapshot `unitPrice` at checkout).

**Why JWT, not only server sessions?**  
Five services must trust the same login without calling user-service on every request. They **verify** the access JWT with a shared `JWT_SECRET`. Refresh lives only on user-service (hash in Mongo).

**Why cookies and Bearer?**  
Browser: HttpOnly cookies so XSS cannot read tokens. Native/Postman: Bearer. Returning tokens in JSON by default would undo HttpOnly if the SPA saved them — so JSON tokens require `X-Auth-Response: tokens`.

**Why not revoke access on logout?**  
Textbook JWT: access is stateless until `exp`. Immediate kill needs a denylist or `tokenVersion` on every request (we removed that on purpose). Refresh revoke + short TTL is the default.

**Why Rabbit, not HTTP between services?**  
HTTP checkout → inventory couples availability and latency. A queue absorbs spikes and inventory restarts. Cost: eventual consistency (order exists before stock is reserved).

**Why CSRF?**  
Cookies are sent automatically by the browser. `SameSite=Lax` helps; double-submit (`csrf_token` + `X-CSRF-Token`) is the extra check on cookie-authenticated mutations. Bearer is not cookie-based, so CSRF is skipped.

## API map (all under `/api`)

| Service | Public | Authenticated |
|---|---|---|
| user | `POST /users`, `POST /auth/login`, `POST /auth/refresh` | `GET/PATCH/DELETE /users/me`, `POST /auth/logout` |
| product | `GET /products`, `GET /products/:id` | create / patch / delete |
| inventory | `GET /inventory`, `GET /inventory/:productId` | set qty, reserve, release |
| cart | — | `GET /carts`, item add/patch/delete, clear |
| order | — | list mine, get one, create, patch status |
| all | `/health`, `/health/live`, `/health/ready` | — |

Errors: **400** validation, **401** auth, **403** CSRF, **409** unique email/sku, **429** rate limit, **404**, **500**. Live = process up; ready = Mongo (and Rabbit if messaging is loaded).

Auth details (cookies, curl, limits): [docs/auth.md](docs/auth.md). Events: [docs/rabbitmq.md](docs/rabbitmq.md).

## Auth (short)

| Control | Choice |
|---|---|
| Password | bcrypt 12 |
| Access | JWT ~15m, `typ=access` |
| Refresh | JWT ~7d, hashed in Mongo, **rotated**, reuse clears hash |
| Browser | HttpOnly access/refresh, `SameSite=Lax`, CSRF cookie + header |
| CORS | Explicit origins; `*` locally → localhost list; forbidden in production |
| Rate limit | Login/register 5/min, refresh 10/min, else 120/min |

## Run locally

```bash
npm install
cp apps/user-service/.env.example apps/user-service/.env
# same for product, inventory, cart, order

docker compose up -d          # Mongo :27017, RabbitMQ :5672, UI :15672 guest/guest

npx nx serve user-service     # one terminal each, or:
npx nx run-many -t serve --projects=user-service,product-service,inventory-service,cart-service,order-service
```

Start **inventory-service** before creating products so `product.created` has a consumer. Nx webpack-builds then runs `dist/main.js`.

```bash
curl http://localhost:3000/api/health/live
```

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port |
| `MONGO_URI` | This service’s DB |
| `RABBITMQ_URL` | `amqp://localhost:5672` |
| `JWT_SECRET` | Access verify/sign — **same on every service** |
| `JWT_REFRESH_SECRET` | Refresh (user-service signs) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `7d` |
| `CORS_ORIGIN` | Frontend origin(s), comma-separated |
| `COOKIE_SECURE` | `false` on HTTP; `true` on HTTPS |
| `NODE_ENV=production` | Mongo + Rabbit required, 32-char secrets, explicit CORS |

## Repo layout

```
apps/<service>/src/main.ts     bootstrapNestApp(AppModule, { defaultPort })
apps/<service>/src/app/        feature module: controller, service, dto, schema
packages/common/               AuthModule, MessagingModule, health, mongoWrite
```

Add a service: generate Nx Nest app → `databaseImports` → `bootstrapNestApp` → `AuthModule` after `DatabaseModule` → `MessagingModule` only if it publishes/subscribes. See [docs/common.md](docs/common.md).
