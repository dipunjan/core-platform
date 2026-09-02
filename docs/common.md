# `@core-platform/common`

Shared Nest **platform** code — the answer to “how do five services not copy-paste JWT and Mongo setup?” Domain (User, Order, Cart) stays in `apps/`. Interview + import list.

**One sentence:** a private Nx library every service imports for boot, auth guard, env validation, health, Mongo duplicate-key mapping, and Rabbit publish/subscribe.

## What to say

**Why a library, not a mega `utils.ts` in each app?**  
One change to the JWT guard or Helmet/CORS applies everywhere. Interviewers look for “shared kernel” vs “copy the guard five times.”

**Why not put Order logic in common?**  
If cart and orders share a schema in common, you have recreated a distributed monolith. Rule: **business logic in the app**. Common is “how a Nest process starts and authenticates.”

**How do apps import?**  
Only the package root (`@core-platform/common`). Never `packages/common/src/auth/...` — the barrel (`index.ts`) is the public API. That way you can move files without breaking apps.

**What about versions?**  
It’s `0.0.1` inside the monorepo, not published to npm. Nx compiles it with the apps. In a company you’d version it or extract it when a second repo needs the same guard.

## Import

```ts
import {
  AuthCookieService,
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

## Public API

| Export | Why (interview) |
|---|---|
| `bootstrapNestApp` | Same Helmet, CORS, `/api` prefix, ValidationPipe, shutdown hooks on every port |
| `databaseImports()` | Config + Mongoose from `MONGO_URI` |
| `mongoWrite` | Mongo `11000` → **409** instead of 500 |
| `throwDuplicate` / `isDuplicateKey` | Same mapping when you already `catch`; cart may retry |
| `isVersionError` | Occupied `__v` — cart optimistic concurrency |
| `AuthModule` | Global JWT guard, CSRF on cookie writes, throttling, cookies |
| `Public` | Catalog GET, login, health skip the guard |
| `CurrentUser` / `AuthUser` | `{ sub, email }` — ownership |
| `HealthModule` | live vs ready (k8s probes) |
| `MessagingModule` / `EventPublisher` / `Events` / `eventSubscribe` | One exchange, typed routing keys |

If it is **how every Nest app boots**, it belongs here. If it is **a product rule**, it belongs in an app.

## Folder layout

```
packages/common/src/
  index.ts                         # only public exports
  bootstrap/bootstrap.ts
  config/env.validation.ts
  http/cors.ts                     # pinned CORS
  database/                        # mongoose + duplicate-key
  auth/                            # guard, cookies, session JSON
  health/
  messaging/                       # exchange, publisher, subscribe helper
```
