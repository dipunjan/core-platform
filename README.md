# Core Platform

Nx + NestJS e-commerce **microservices** monorepo. Each capability is its own Nest app with its own Mongo database. Public APIs are HTTP. Side effects between services go over **RabbitMQ**.

Nx runs `build` / `serve` / `lint`. Docker only runs **MongoDB** and **RabbitMQ** locally — Nest apps run on your machine via Nx.

## Docs

| Topic | Doc |
|---|---|
| Sign up, login, logout, tokens, how APIs are protected, curl tests | [docs/auth.md](docs/auth.md) |
| Events, queues, DLQ, how to test inventory from orders/products | [docs/rabbitmq.md](docs/rabbitmq.md) |
| `@core-platform/common` exports and folder layout | [docs/common.md](docs/common.md) |

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Client / HTTP               │
                    └──────────────┬──────────────────────┘
           ┌───────────┬───────────┼───────────┬───────────┐
           ▼           ▼           ▼           ▼           ▼
      user-service  product-   inventory-  cart-      order-
      :3000         service    service     service    service
                    :3001      :3002       :3003      :3004
           │           │           │           │           │
           └───────────┴─────┬─────┴───────────┴───────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                             ▼
         MongoDB :27017              RabbitMQ :5672
         (one DB per service)        topic exchange
                                     `core-platform`
```

| App | Port | Mongo DB | Role |
|---|---|---|---|
| `user-service` | 3000 | `users` | Register, login, profile |
| `product-service` | 3001 | `products` | Catalog |
| `inventory-service` | 3002 | `inventory` | Stock |
| `cart-service` | 3003 | `carts` | Carts |
| `order-service` | 3004 | `orders` | Orders |

Nx project names match the folders (`npx nx serve user-service`). npm packages are `@core-platform/<app>` next to `@core-platform/common`.

Services do **not** share collections.

A request with a token:

```
  Client
    │  Authorization: Bearer <access>
    ▼
  Service  ── JwtAuthGuard ──►  401 if missing / expired / refresh JWT
    │                           else controller + this service's Mongo
    └── (some writes) publish ──► RabbitMQ  ──► inventory-service
```

Auth and events in more detail: [docs/auth.md](docs/auth.md), [docs/rabbitmq.md](docs/rabbitmq.md).

```
apps/user-service/src/
  main.ts                          # bootstrapNestApp(...)
  app/
    app.module.ts                  # Database, Auth, Messaging, Health, feature
    database.module.ts
    users/                         # controller, service, dto, schemas
```

HTTP is the public API. RabbitMQ is only when another service must react (see [docs/rabbitmq.md](docs/rabbitmq.md)). Auth is access + refresh JWT (see [docs/auth.md](docs/auth.md)).

## Commands

```bash
npm install
cp apps/user-service/.env.example apps/user-service/.env
cp apps/product-service/.env.example apps/product-service/.env
cp apps/inventory-service/.env.example apps/inventory-service/.env
cp apps/cart-service/.env.example apps/cart-service/.env
cp apps/order-service/.env.example apps/order-service/.env

docker compose up -d          # Mongo :27017, RabbitMQ :5672, UI :15672 (guest/guest)
# if `docker compose` is missing: docker-compose up -d

npx nx serve user-service     # one terminal per service
npx nx serve product-service
npx nx serve inventory-service
npx nx serve cart-service
npx nx serve order-service

npx nx run-many -t serve --projects=user-service,product-service,inventory-service,cart-service,order-service
npx nx run-many -t build --all
npx nx lint user-service
```

Nx builds with webpack, then runs `dist/main.js`. That is expected.

Health: `curl http://localhost:3000/api/health/live` and `/api/health/ready`.

## Environment

Copy `.env.example` → `.env` in each app (gitignored). `ConfigModule` loads `apps/<service>/.env` then workspace `.env`.

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port |
| `MONGO_URI` | This service’s database (`mongodb://localhost:27017/users`, …) |
| `RABBITMQ_URL` | `amqp://localhost:5672` |
| `JWT_SECRET` | Access token (same value on every service) |
| `JWT_REFRESH_SECRET` | Refresh token (user-service signs; all `.env` files still set it) |
| `JWT_ACCESS_EXPIRES_IN` | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGIN` | `*` or an origin list |
| `NODE_ENV=production` | Requires Mongo, Rabbit, and 32-char secrets |

## Errors and health

- Bad JSON / extra fields → **400** (`ValidationPipe`)
- `NotFoundException`, `UnauthorizedException`, `ConflictException` → matching status
- Unique index (`email`, `sku`, …) → **409** via `mongoWrite()` in common
- Anything else → **500**
- `/api/health/live` — process up; `/api/health/ready` — Mongo (+ Rabbit if messaging is loaded)

## Adding a service

1. `npx nx g @nx/nest:app --name=payment-service --directory=apps/payment-service --e2eTestRunner=none --linter=eslint --unitTestRunner=none`
2. `databaseImports({ envFile: 'apps/payment-service/.env', defaultMongoUri: 'mongodb://localhost:27017/payments' })`
3. `bootstrapNestApp(AppModule, { defaultPort: 3005 })`
4. Feature module with controller, service, dto, schema
5. `AuthModule` after `DatabaseModule`. `MessagingModule` only if it publishes or subscribes
6. `.env.example` and `nx` `build` `outputs` `{projectRoot}/dist`

## Repo map

| Path | Purpose |
|---|---|
| `apps/*` | Nest services |
| `packages/common` | Shared boot, auth, Mongo, health, messaging — [docs/common.md](docs/common.md) |
| `docs/` | Auth, RabbitMQ, common |
| `docker-compose.yml` | Local Mongo + RabbitMQ |
| `nx.json` / `tsconfig.base.json` | Nx and TypeScript |
