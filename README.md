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
| Roadmap (what’s next) | [docs/roadmap.md](docs/roadmap.md) |
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
| http://localhost:5174 | Admin (sales, products, people, inventory, payments) |
| http://localhost:5174/branding | Logo, hero, currency, promo tiles |
| http://localhost:5174/payments | Stripe / Razorpay / demo payment settings |

Upload images on **Branding** — they go live on the shop immediately. Empty slots show placeholders until you upload something.

Sample SVGs and copy to paste: [branding-samples/README.md](branding-samples/README.md). A **fresh** database also gets Swoop branding, hero image, and three promo tiles automatically from `apps/product-service/seed/`.

**Promo tiles** (optional, under the hero): headline + image + link, then **Add tile**. Required fields show a red **\***. Format hints stay gray under each field; red errors appear under the field only after you click Add tile.

Admin forms use inline hints, loading spinners, green success banners, and confirm dialogs before deletes so non-technical staff get clear feedback.

### Shopper journey (UX)

| Step | What you see |
|------|----------------|
| Browse | Home and shop show loaders while the catalog loads |
| Search | Live AJAX in the header — **no Search button**. Debounced 300ms, min 2 chars, results on `/shop?q=` (server-side query) |
| Add to cart | **Add to cart** or quantity stepper on the card when the item is already in the bag |
| Cart | Subtotal before checkout; cart count in the header loads on first visit |
| Checkout | Order summary sidebar; after place order → payment step |
| Payment | `/checkout/pay/:orderId` — Stripe, Razorpay (India), or demo pay without keys |
| After order | Green confirmation on Orders once payment succeeds; line items show product names |
| Guest vs signed in | Orders link appears only when logged in; cart works for guests until checkout |

Full UI notes: [docs/frontend.md](docs/frontend.md).

```bash
curl http://localhost:3000/api/health/live
```

Each API also serves **OpenAPI (Swagger) docs** at `/api/docs` (e.g. http://localhost:3004/api/docs for order-service, including payments). Use **Authorize → Bearer** in Swagger UI when testing with a JWT from Postman. Docs are generated from Nest controllers via `@nestjs/swagger` in the shared `bootstrapNestApp` helper.

## Shop & admin stack (frontends)

Both `apps/web` and `apps/admin` use **TanStack Query** for server state and **react-hook-form + zod** for forms. **Redux is not used** — auth session lives in the React Query cache (`query/auth.ts`).

| Layer | Library | Where |
|-------|---------|--------|
| Auth session | TanStack Query | `useMeQuery`, login/logout mutations in `query/auth.ts` |
| Catalog, cart, orders, payments, admin CRUD | TanStack Query | `src/query/` (`catalog.ts`, `cart.ts`, `orders.ts`, `payments.ts`, …) |
| Forms | react-hook-form + **zod** | Schemas in `src/lib/schemas.ts`; pages use `Field` + `register()` |
| HTTP | axios | `api/http.ts` (cookies + CSRF on mutating requests) |

Details and folder map: [docs/frontend.md](docs/frontend.md). Naming: [docs/conventions.md](docs/conventions.md).

## Environment variables

| Name | Meaning |
|------|---------|
| `MONGO_URI` | Mongo URL (`?replicaSet=rs0` locally) |
| `REDIS_URL` | Redis URL |
| `RABBITMQ_URL` | Rabbit URL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Same in all five APIs |
| `CORS_ORIGIN` | Shop + admin origins |
| `ADMIN_EMAIL` | user-service — admin on login |
| `PRODUCT_SERVICE_URL` | order-service — live prices + storefront payment config |
| `OUTBOX_POLL_MS` | order-service — relay interval (default `2000`) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | order-service — Stripe payments |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | order-service — Razorpay (India) |
| `PAYMENT_SIMULATE` | order-service — `true` allows demo checkout without gateway keys (dev default) |
| `TRUST_PROXY` | `true` behind gateway |
| `COOKIE_SECURE` | `false` localhost; `true` HTTPS |
| `NODE_ENV=production` | Stricter validation |

## Repo layout

```
apps/user-service        accounts, auth
apps/product-service     catalog, storefront, uploads
apps/inventory-service   stock
apps/cart-service        carts
apps/order-service       orders, payments (Stripe/Razorpay), outbox relay
packages/common          shared bootstrap, auth, redis, messaging
apps/web                 shop UI (TanStack Query + RHF/zod)
apps/admin               staff UI (TanStack Query + RHF/zod)
docs/                    one topic per file
postman/                 API collection
```

HTTP status codes and **304**: [docs/performance.md](docs/performance.md).
