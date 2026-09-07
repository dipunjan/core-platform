# Interview guide — swoop (core-platform)

Use this when someone asks “walk me through your project.” Plain language first; tradeoffs second.

## 30-second pitch

> swoop is a small e-commerce platform: five NestJS microservices, two React frontends (shop + admin), MongoDB as source of truth, Redis for shared rate limits and short-lived cache, and RabbitMQ for async stock updates. Shoppers browse as guests, sign in at checkout, and place orders. Orders use a **transactional outbox** — order + event row commit together; a relay publishes to Rabbit so stock is never lost if the broker blips.

## System map (say this out loud)

```
Browser (shop :5173 or admin :5174)
    → five APIs on :3000–3004 (/api/users, /products, …)
    → Mongo (users, products, carts, orders, stock)
    → Redis (throttle, logout denylist, ~45s catalog cache)
    → RabbitMQ (product created, order created/cancelled → inventory)
```

Full diagram: [architecture.md](architecture.md).

## Why microservices here?

| Service | Owns | Why separate |
|---|---|---|
| user-service | accounts, JWT, addresses | Auth changes rarely; one place for refresh tokens |
| product-service | catalog, categories, storefront, image files | Read-heavy; cache-friendly |
| inventory-service | on-hand + reserved | Stock rules isolated; listens to events |
| cart-service | signed-in carts | Different access pattern than orders |
| order-service | checkout, order history | Writes money totals; publishes events |

**Tradeoff:** more moving parts. **Win:** each team/process can scale and deploy independently; blast radius is smaller.

## Customer journey (end to end)

1. **Browse** — `GET /products`, `GET /storefront`. product-service may serve from Redis catalog cache (~45s TTL; writes bump generation).
2. **Guest cart** — lines live in `localStorage` until login (Amazon-style: cart before account).
3. **Login at checkout** — HttpOnly cookies + CSRF on mutating requests. JWT access ~15m; refresh ~7d hashed in Mongo.
4. **Merge cart** — guest lines `POST` into cart-service.
5. **Place order** — `POST /orders` with `productId` + `quantity` only. Server-side pricing. Optional `Idempotency-Key`. Order + outbox row commit in one Mongo transaction (10/min rate limit).
6. **Stock** — outbox relay publishes `ORDER_CREATED` to Rabbit (~2s) → inventory reserves quantity (idempotent handler).
7. **Logout** — refresh revoked in Mongo; access JWT denylisted in Redis until `exp`.

## Auth — what to say in an interview

- **Not** `localStorage` for tokens — HttpOnly cookies on the shop.
- **JWT in cookies** fits five APIs: each service verifies `JWT_SECRET` without a shared session DB on every request.
- **Redis denylist** only for “I logged out but access JWT still valid for 15m.”
- **Postman** uses Bearer — same token, different envelope; not a security hole if tokens are not leaked.
- **CSRF** on cookie POST/PATCH/DELETE — browser auto-sends cookies; `X-CSRF-Token` proves the request came from our site.

Details: [security.md](security.md).

## Redis — when and when not

| Use | Why |
|---|---|
| Rate limits (all APIs) | One counter bucket across all instances |
| Logout denylist | Kill access JWT before `exp` |
| Catalog cache | Cut Mongo reads on home/shop |

| Do **not** use Redis for |
|---|
| Carts, orders, stock (Mongo is truth) |
| Classic “session store” for every request |

**If Redis is down:** throttle and denylist **fail open** (shop stays up; slightly weaker security). Catalog falls back to Mongo. `/api/health/ready` reports Redis `down`.

Details: [redis.md](redis.md).

## RabbitMQ — async stock

- Order HTTP returns after Mongo writes **order + outbox** in one transaction.
- **Outbox relay** polls every ~2s, publishes to Rabbit (3 retries per row), marks `publishedAt`.
- Inventory consumer is **idempotent** — safe if the same message is delivered twice.
- Failed messages go to DLQ `core-platform.dlq`.
- Product/user events still publish directly; only orders use the outbox.

Details: [rabbitmq.md](rabbitmq.md).

## High traffic — what we did vs what’s next

| In this repo | Typical next step at scale |
|---|---|
| Stateless APIs (JWT, no in-memory session) | Horizontal pod replicas behind a gateway |
| Redis-backed throttling | Same — already shared across instances |
| Catalog cache | CDN for images; longer cache for static lists |
| Mongo indexes on orders (`userId`, `idempotencyKey`) | Read replicas for catalog |
| Checkout idempotency | Payment provider idempotency keys |
| Order outbox | Already implemented — relay can be scaled or replaced with a dedicated worker |
| `trust proxy` for correct client IP | API gateway (Kong, nginx, ALB) |

**Not in repo (say honestly):** circuit breakers, distributed tracing, metrics dashboards, payment integration, HA file storage for storefront uploads (local disk today).

## “What breaks if X is down?”

| Component down | What happens |
|---|---|
| Mongo | APIs not ready; shop cannot read/write data |
| Redis | Ready may fail; limits/denylist fail open; catalog hits Mongo |
| RabbitMQ | Orders still create (outbox rows queue); stock reserve delayed until relay + consumer run |
| product-service | Checkout cannot price items → order fails |
| inventory-service | Orders succeed; reserved count stale until consumer runs |
| Single API instance | Others keep working; gateway routes around dead instance |

## Data model highlights

- Prices in **integer cents**; display currency from `storefront.currency`.
- **Category** = taxonomy slug (`apparel`). **Featured** = boolean on product, not a category.
- Order stores `unitPrice` at checkout time (snapshot); totals computed server-side.
- Stock: `quantity` on-hand, `reserved` held for pending orders.

## Admin vs shop

- Same user table; `ADMIN_EMAIL` promoted to `admin` role on login.
- Admin: branding (logo/hero/currency), people, catalog, stock, sales — no payment UI.
- Admin does not call cart-service.

## Code layout (if they ask “show me structure”)

- Backends: `apps/<service>/src/app/<feature>/` — controller, service, module, `dto/`, `schemas/`.
- Frontends: `routes/` → `pages/` → `hooks/` → `features/` (Redux) → `api/http.ts`.
- Shared: `@core-platform/common` only — bootstrap, auth, redis, messaging, health.

[conventions.md](conventions.md) · [common.md](common.md)

## Demo script (5 minutes)

1. `docker compose up -d` — Mongo, Redis, Rabbit.
2. Start all five services + `nx serve web`.
3. Browse `/shop` without login; add to cart.
4. Checkout → register → place order.
5. Rabbit UI: message consumed; inventory `reserved` increases.
6. Admin `:5174` — change product; cache may lag ~45s on shop.
7. Logout → denied access on cart API with old cookie (if Redis up).

## Questions they often ask

**Why not one monolith?**  
Learning/demo scope + clear service boundaries. A monolith would be fine for this traffic level.

**How do you prevent overselling?**  
Reserve on `ORDER_CREATED`. Small window: order exists before reserve completes. Stricter systems use reserve-before-commit or saga.

**Why guest cart in localStorage?**  
Cart API is per user id; guests have no id until login. Merge on sign-in matches common retail UX.

**How is this production-ready?**  
Solid patterns: auth, validation, health checks, shared throttle, **transactional outbox** for orders, event-driven stock, server-side pricing, idempotent checkout. Remaining gaps: observability, HA uploads, payment — document them rather than pretend.

## Doc index

| Topic | File |
|---|---|
| Run locally | [README](../README.md) |
| Architecture | [architecture.md](architecture.md) |
| Deploy | [deploy.md](deploy.md) |
| Security | [security.md](security.md) |
| Redis | [redis.md](redis.md) |
| RabbitMQ | [rabbitmq.md](rabbitmq.md) |
| Frontends | [frontend.md](frontend.md) |
| Postman | [postman.md](postman.md) |
