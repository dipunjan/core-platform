# Core Platform (swoop)

Five APIs, two React sites, MongoDB, Redis, RabbitMQ — a small e-commerce platform you can run locally and explain in an interview.

**Start here:** [docs/study-guide.md](docs/study-guide.md) — pitch, demo, reading order. Each doc below teaches one topic in full (simple language + how to say it in an interview).

## Documentation

| Topic | File |
|-------|------|
| **Study guide (start here)** | [docs/study-guide.md](docs/study-guide.md) |
| System design & shopper journey | [docs/architecture.md](docs/architecture.md) |
| Login, CSRF, checkout security | [docs/security.md](docs/security.md) |
| Redis | [docs/redis.md](docs/redis.md) |
| HTTP codes, 304, slowness | [docs/performance.md](docs/performance.md) |
| Outbox & RabbitMQ | [docs/rabbitmq.md](docs/rabbitmq.md) |
| Gaps: payments, tracing, etc. | [docs/roadmap.md](docs/roadmap.md) |
| Deploy | [docs/deploy.md](docs/deploy.md) |
| Shop/admin UI | [docs/frontend.md](docs/frontend.md) |
| Postman | [docs/postman.md](docs/postman.md) |
| Shared package | [docs/common.md](docs/common.md) |
| Naming conventions | [docs/conventions.md](docs/conventions.md) |

## Run locally

```bash
npm install

cp apps/user-service/.env.example apps/user-service/.env
cp apps/product-service/.env.example apps/product-service/.env
cp apps/inventory-service/.env.example apps/inventory-service/.env
cp apps/cart-service/.env.example apps/cart-service/.env
cp apps/order-service/.env.example apps/order-service/.env

docker compose up -d

npx nx serve user-service
npx nx serve product-service
npx nx serve inventory-service
npx nx serve cart-service
npx nx serve order-service
npx nx serve web      # http://localhost:5173
npx nx serve admin    # http://localhost:5174
```

Start **inventory** before creating products. Admin: `ADMIN_EMAIL` (default `ada@example.com`) — log out and back in once for admin role.

### Staff panel & branding

| URL | Purpose |
|-----|---------|
| http://localhost:5174 | Admin (sales, products, people, inventory) |
| http://localhost:5174/branding | Logo, hero, currency, promo tiles |

Upload images on **Branding** — they go live on the shop immediately. Empty slots show placeholders until you upload something.

Sample SVGs and copy to paste: [branding-samples/README.md](branding-samples/README.md).

**Promo tiles** (optional, under the hero): headline + image + link, then **Add tile**. The form stays quiet until you start typing or click Add tile; validation messages appear only then.

Admin forms use inline hints, loading spinners, and green success banners so non-technical staff get clear feedback.

```bash
curl http://localhost:3000/api/health/live
```

## Environment variables

| Name | Meaning |
|------|---------|
| `MONGO_URI` | Mongo URL (`?replicaSet=rs0` locally) |
| `REDIS_URL` | Redis URL |
| `RABBITMQ_URL` | Rabbit URL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Same in all five APIs |
| `CORS_ORIGIN` | Shop + admin origins |
| `ADMIN_EMAIL` | user-service — admin on login |
| `PRODUCT_SERVICE_URL` | order-service — live prices |
| `OUTBOX_POLL_MS` | order-service — relay interval (default `2000`) |
| `TRUST_PROXY` | `true` behind gateway |
| `COOKIE_SECURE` | `false` localhost; `true` HTTPS |
| `NODE_ENV=production` | Stricter validation |

## Repo layout

```
apps/user-service        accounts, auth
apps/product-service     catalog, storefront, uploads
apps/inventory-service   stock
apps/cart-service        carts
apps/order-service       orders + outbox relay
packages/common          shared bootstrap, auth, redis, messaging
apps/web                 shop UI
apps/admin               staff UI
docs/                    one topic per file
postman/                 API collection
```

HTTP status codes and **304**: [docs/performance.md](docs/performance.md).
