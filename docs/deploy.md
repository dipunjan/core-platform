# Putting this backend on the internet

This code is the **shop server**, not the website.

On your laptop you run five programs on five ports. That is for learning. Real users need one HTTPS address, a real database, and secrets that are not in git.

You can show the APIs with Postman without a website. You **cannot** point a real website at `localhost`.

## Why bother?

- Passwords, carts, and stock cannot live only in the browser.
- The five programs should run as five processes so one can restart without killing all of them.
- Mongo (data), Redis (short shared state), and RabbitMQ (notes between programs) must keep running.
- Cookies marked “secure” only work on **https**.

## Simple production picture

```
  People
    │  https
    ▼
  Website  (`apps/web` shop + `apps/admin` staff)     see frontend.md and architecture.md
    │
    ▼
  One public API address      e.g. https://api.myshop.com
    │  sends /users to user program
    │  /products to product program
    │  … same for stock, cart, orders
    ▼
  The five programs
    ├── MongoDB (data)
    ├── Redis (rate limits, logout denylist, catalog cache)
    └── RabbitMQ (notes)
```

On the laptop the website would call five different ports. On the internet, put a **front door** (gateway or proxy) so the browser only sees **one** host. That makes cookies much easier.

## Checklist

1. **Package each program**  
   Build it (`npx nx build …`) and run `node dist/main.js` in a container. Do not put Mongo inside the same image.

2. **Use a real Mongo, Redis, and Rabbit**  
   Not `guest/guest` from local Docker. Use hosted stores with backups. Redis is not a substitute for Mongo. Mongo must be a **replica set** if you use transactions (order outbox).

3. **Secrets**  
   Long random `JWT_SECRET` (same in all five programs) and `JWT_REFRESH_SECRET`. Put them in the host’s secret store, not in GitHub. Set `NODE_ENV=production`.

4. **HTTPS**  
   `COOKIE_SECURE=true`. The front door handles the certificate.

5. **Who may call you**  
   `CORS_ORIGIN=https://www.myshop.com` (your real site). Not `*`.

6. **Front door routes**  
   `/api/users` and `/api/auth` → user program, `/api/products` → product, and so on. Forward cookies and headers.

7. **Health checks**  
   “Still running?” → `/api/health/live`  
   “Database OK?” → `/api/health/ready`

8. **Start order**  
   Database and Rabbit first, then the five programs. Prefer inventory up before you create products.

9. **More traffic later**  
   Run extra copies of a program behind the front door. They do not keep user session in memory (the pass is in the token).

This repo includes a React shop in `apps/web` for local use. On the internet you still want **one HTTPS API host** (a gateway) plus HTTPS for the site. Local `docker-compose.yml` starts **Mongo, Redis, and RabbitMQ** — not the five APIs.

10. **Behind a gateway**  
    Set `TRUST_PROXY=true` (or `NODE_ENV=production`) so rate limits see the real client IP, not the proxy. Forward `X-Forwarded-For` from the gateway.

11. **Order service**  
    `PRODUCT_SERVICE_URL` must point at product-service so checkout reads **server-side prices** (the client cannot set `unitPrice`).

## What changes from laptop to internet

| On your laptop | On the internet |
|---|---|
| `COOKIE_SECURE=false` | `true` |
| CORS = localhost | Your real website URL |
| Short demo secrets | Long random secrets |
| Mongo/Rabbit on localhost | Hosted URLs |
| Five open ports | One https name |

## After it is up, try

- Health ready through the public URL
- Register/login from the real website (cookies + https)
- Create a product → stock row appears
- Place an order → reserved count goes up

If login cookies fail, check: http mixed with https, wrong website in `CORS_ORIGIN`, front door dropping `Set-Cookie`, or the website not sending `credentials: 'include'`. Why cookies vs Bearer: [security.md](security.md).

What is **not** in this deploy guide (payments, observability): [roadmap.md](roadmap.md).
