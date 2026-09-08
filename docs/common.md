# Shared code (`packages/common`)

Five programs would copy the same “start the server, check login, talk to the database” code. Instead that lives in **one library**: `@core-platform/common`.

**Shop rules** (what a cart is, how an order changes status) stay in each app. Common is only **how the program starts** and **how it checks a login**.

## Rule of thumb

- Shared start-up, login check, health URL, sending notes, Redis client → **common**
- Users, products, carts, orders → **the matching app**

Apps import from the package name only:

```ts
import { AuthModule, bootstrapNestApp, CurrentUser } from '@core-platform/common';
```

Do not import files deep inside `packages/common/src/...`. If we move a file, your app would break.

Feature folders inside each API: [conventions.md](conventions.md).

This library is **not** published to npm. It only exists in this folder. Nx builds it with the apps.

How the five APIs and two UIs fit together: [architecture.md](architecture.md).

## What you get (plain names)

| Name | What it does |
|---|---|
| `bootstrapNestApp` | Starts HTTP, security headers, `/api` prefix, OpenAPI at `/api/docs` |
| `databaseImports` | Connects Mongo using `MONGO_URI` |
| `mongoWrite` | Duplicate email/sku becomes **409**, not a crash |
| `AuthModule` | Checks the access pass on every route unless marked public |
| `Public` | “No login needed” (catalog, login, health) |
| `CurrentUser` | The logged-in user id and email |
| `HealthModule` | “Am I up?” Mongo, Redis, Rabbit if used |
| `RedisModule` (internal) / `CatalogCache` / `TokenDenylist` | Rate limits, logout denylist, catalog cache |
| `MessagingModule` / `EventPublisher` | Send notes through RabbitMQ (3 retries on failure) |

## Folders

```
packages/common/src/
  bootstrap/    start the server
  auth/         login check and cookies
  database/     Mongo helpers
  health/       live / ready
  redis/        ioredis, throttle storage, denylist, catalog cache
  messaging/    RabbitMQ
  http/         which websites may call us
```
