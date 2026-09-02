# `@core-platform/common`

Shared Nest plumbing. **Not** domain code — users, products, and orders stay in their apps.

Apps import **only** from the package root. Never deep-import a file under `packages/common/src/`.

```ts
import {
  AuthModule,
  bootstrapNestApp,
  CurrentUser,
  databaseImports,
  EventPublisher,
  Events,
  eventSubscribe,
  HealthModule,
  isDuplicateKey,
  isVersionError,
  mongoWrite,
  throwDuplicate,
  type AuthUser,
  type OrderCreatedEvent,
} from '@core-platform/common';
```

## Public API (`packages/common/src/index.ts`)

| Export | Why |
|---|---|
| `bootstrapNestApp` | Helmet, CORS, shutdown hooks, `/api` prefix, `ValidationPipe`, listen on `PORT` |
| `databaseImports()` | `ConfigModule` + `MongooseModule.forRoot` from `MONGO_URI` |
| `mongoWrite` | Wrap a Mongo write: unique-index (`11000`) → `ConflictException` (409) |
| `throwDuplicate` | Same mapping when you already have a `catch` |
| `isDuplicateKey` | `11000` check when the service should retry instead of 409 (cart create) |
| `isVersionError` | Mongoose `__v` conflict — cart retries the read/write |
| `AuthModule` | JWT verify (`Authorization: Bearer`), global `JwtAuthGuard` |
| `Public` | Skip the JWT guard on a route |
| `CurrentUser` / `AuthUser` | `{ sub, email }` from the token |
| `HealthModule` | `GET /api/health`, `/live`, `/ready` |
| `MessagingModule` | RabbitMQ connection + DLQ |
| `EventPublisher` | Publish to exchange `core-platform` |
| `Events` + payload types | Routing keys and event bodies |
| `eventSubscribe` | Durable queue + DLX binding for `@RabbitSubscribe` |

If it is **business logic**, it belongs in an app. If it is **how every Nest app boots**, it belongs in common.

## Folder layout

```
packages/common/src/
  index.ts                         # only public exports — this is what apps import
  bootstrap/
    bootstrap.ts                   # NestFactory, Helmet, CORS, ValidationPipe
  config/
    env.validation.ts              # MONGO_URI, JWT_SECRET, CORS_ORIGIN, …
  database/
    database.ts                    # databaseImports()
    duplicate-key.ts               # mongoWrite, throwDuplicate, isDuplicateKey, isVersionError
  auth/
    auth.module.ts                 # JwtModule + APP_GUARD
    jwt-auth.guard.ts
    public.decorator.ts            # @Public()
    current-user.decorator.ts      # @CurrentUser()
    auth.types.ts                  # AuthUser
  health/
    health.module.ts
    health.controller.ts           # live / ready
  messaging/
    messaging.module.ts            # RabbitMQModule
    event-publisher.ts
    events.ts                      # Events, payload types, exchange names
    subscribe.ts                   # eventSubscribe()
```
