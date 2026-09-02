# Core Platform

Nx + NestJS e-commerce **microservices** monorepo. Each business capability is its own Nest app with its own Mongo database. Services talk over HTTP for their public APIs and over **RabbitMQ** for async events.

Nest is the framework inside each service. Nx is the workspace runner (`build`, `serve`, `lint`). Docker only runs **MongoDB** and **RabbitMQ** locally — the Nest apps still run on your machine via Nx.

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

| App | Port | Mongo DB | HTTP prefix | Role |
|---|---|---|---|---|
| `user-service` | 3000 | `users` | `/api` | Register, login, profile |
| `product-service` | 3001 | `products` | `/api` | Catalog |
| `inventory-service` | 3002 | `inventory` | `/api` | Stock |
| `cart-service` | 3003 | `carts` | `/api` | Carts |
| `order-service` | 3004 | `orders` | `/api` | Orders |

Nx project names match the folder names (`npx nx serve user-service`). npm package names are all `@core-platform/<app>` so they sit next to `@core-platform/common`.

Each service owns its data. They do **not** share collections. That is why there are five database names on one Mongo process.

```
apps/
  user-service/
  product-service/
  inventory-service/
  cart-service/
  order-service/
packages/
  common/          # @core-platform/common — shared Nest plumbing
```

### What a service looks like

Nx Nest layout: `src/app` is the root module. Domain lives in a **feature module**, not in `AppController`.

```
apps/user-service/src/
  main.ts                          # bootstrapNestApp(...)
  app/
    app.module.ts                  # Database, Auth, Messaging, Health, Users
    database.module.ts             # MONGO_URI for this service
    users/
      users.module.ts
      users.controller.ts          # HTTP
      users.service.ts             # business logic + Mongo + events
      dto/                         # class-validator request bodies
      schemas/                     # Mongoose models
```

HTTP stays the public API. RabbitMQ is used **only when another service needs to react** (inventory listening to orders, for example).

## Why `packages/common` exists

`@core-platform/common` is **not** domain code. Users, products, and orders stay in their apps. Common holds things every service would otherwise copy.

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

### Public API (`packages/common/src/index.ts`)

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

### Folder layout

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


## Docker: what it is for

Docker is **not** running the Nest services. It only runs infrastructure:

| Container | Image | Host ports | Why |
|---|---|---|---|
| MongoDB | `mongo:6.0.27` | `27017` | Persistence. Each Nest app uses a different DB name on this instance. |
| RabbitMQ | `rabbitmq:3.13-management` | `5672` (AMQP), `15672` (UI) | Async events between services. |

Data for Mongo is stored in the `mongo-data` volume so it survives `docker compose down` (unless you pass `-v`).

Apps read:

```
MONGO_URI=mongodb://localhost:27017/users
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=local-dev-jwt-secret
```

`localhost` works because Compose publishes those ports on your Mac. Inside Kubernetes you would use service DNS instead (for example `mongodb://user-mongo-srv:27017/users`).

RabbitMQ UI: http://localhost:15672 (user `guest`, password `guest`).

If `docker compose` fails in zsh with `command not found: compose`, the Compose **plugin** did not run. Use:

```bash
docker-compose up -d
# or
/usr/local/bin/docker compose up -d
```

## Commands

### One-time setup

```bash
npm install
cp apps/user-service/.env.example apps/user-service/.env
cp apps/product-service/.env.example apps/product-service/.env
cp apps/inventory-service/.env.example apps/inventory-service/.env
cp apps/cart-service/.env.example apps/cart-service/.env
cp apps/order-service/.env.example apps/order-service/.env
```

### Infrastructure

```bash
docker compose up -d          # start Mongo + RabbitMQ
docker compose ps             # check they are running
docker compose logs -f        # follow logs
docker compose down           # stop (keeps Mongo volume)
docker compose down -v        # stop and delete Mongo data
```

### Run services

Nx **builds with webpack, then runs** `dist/main.js`. That is expected.

```bash
npx nx serve user-service
npx nx serve product-service
npx nx serve inventory-service
npx nx serve cart-service
npx nx serve order-service
```

Use a **separate terminal** per service.

```bash
npx nx run-many -t serve --projects=user-service,product-service,inventory-service,cart-service,order-service
```

### Build and lint

```bash
npx nx run-many -t build --all
npx nx build product-service
npx nx lint user-service
npx nx graph
```

## Auth and login

Every service loads `AuthModule`. A global JWT guard runs on every HTTP route. Missing/invalid Bearer token → **401**. `@Public()` opts a route out of that (health, register, login, catalog/inventory GET).

All five apps must share the **same** `JWT_SECRET`. user-service **signs** tokens; the others only **verify**.

```
Client
  │
  │  1. POST /api/users          (public)  create account, hash password, emit user.created
  │  2. POST /api/auth/login     (public)  check password, return JWT
  │
  │  3. Later requests
  │     Authorization: Bearer <accessToken>
  ▼
Any service  →  JwtAuthGuard  →  jwt.verify(JWT_SECRET)
             →  request.user = { sub: userId, email }
             →  @CurrentUser() in the controller
```

Token payload: `{ sub, email }`. `sub` is the Mongo user id. Cart and orders **never** take a user id from the URL or body; they use `sub` so you cannot act as someone else.

### Public vs authenticated

| | Public | Needs Bearer |
|---|---|---|
| user-service | `POST /api/users`, `POST /api/auth/login` | `GET/PATCH/DELETE /api/users/me` |
| product-service | `GET /api/products`, `GET /api/products/:id` | create / update / delete |
| inventory-service | `GET /api/inventory`, `GET /api/inventory/:productId` | set quantity, reserve, release |
| cart-service | — | all `/api/carts*` |
| order-service | — | all `/api/orders*` |
| every service | `/api/health`, `/api/health/live`, `/api/health/ready` | — |

### 1. Register

Password min length is **8**. Email is stored lowercase. The hash is never returned.

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","name":"Ada","password":"secret12"}'
```

Response includes `_id`, `email`, `name`, timestamps — not `password`. Duplicate email → **409**.

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"secret12"}'
```

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "user": { "id": "<mongoUserId>", "email": "ada@example.com", "name": "Ada" }
}
```

Wrong email or password → **401** (`Invalid email or password`).

Export the token for the rest of the session:

```bash
TOKEN=<paste accessToken>
```

### 3. Read and update the current user

There is no `GET /api/users` list and no `GET /api/users/:id`. You only operate on **yourself**.

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace"}'
```

`PATCH /api/users/me` accepts any subset of register fields (`email`, `name`, `password`). A new password is re-hashed. Email is lowercased. After a successful update, user-service publishes `user.updated` (no consumer yet).

```bash
curl -X DELETE http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Use the same token on other services

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Classic Tee","description":"Cotton","price":1299,"sku":"TEE-001"}'

curl -X PUT http://localhost:3002/api/inventory/<productId> \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"quantity":50}'

curl http://localhost:3003/api/carts \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3003/api/carts/items \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"<productId>","quantity":1}'

curl -X POST http://localhost:3004/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<productId>","quantity":1,"unitPrice":1299}]}'
```

`POST /api/orders` does not take `userId`. The order is stored with `userId = token.sub`. `GET /api/orders` returns only that user’s orders.

### 5. What the code is doing

1. `bootstrapNestApp` sets Helmet, CORS, and validation.
2. `AuthModule` registers `JwtModule` with `JWT_SECRET` / `JWT_EXPIRES_IN` and installs `JwtAuthGuard` as `APP_GUARD`.
3. Login: load user with `+password`, `bcrypt.compare`, `jwt.signAsync({ sub, email })`.
4. Guard: skip if `@Public()`; else `Bearer ` + `jwt.verify`; attach `request.user`.
5. Controllers read `@CurrentUser()` (`sub`, `email`).

## How HTTP, Mongo, and RabbitMQ fit together

HTTP is the public API. Mongo is each service’s database. RabbitMQ is the **async bus** so services do not call each other over HTTP for side effects (stock, etc.).

```
Client
  │  POST /api/orders
  ▼
order-service  ──save──►  Mongo DB `orders`
  │
  │  EventPublisher.publish(Events.ORDER_CREATED, payload)
  ▼
RabbitMQ exchange `core-platform`  (topic, durable)
  routing key: order.created
  │
  ▼
queue `inventory.order.created`  (durable, prefetch 1)
  │
  ▼
inventory-service  @RabbitSubscribe  ──update──►  Mongo DB `inventory`
```

Same pattern for `product.created` (inventory creates a stock row) and `order.cancelled` (inventory releases reserved stock).

### How a message is published

1. A service imports `MessagingModule` (from `@core-platform/common`) in `app.module.ts`.
2. The domain service injects `EventPublisher`.
3. After a successful Mongo write it calls `this.events.publish(Events.ORDER_CREATED, payload)`.
4. That publishes to exchange `core-platform` with the event name as the **routing key**.
5. Messages are **persistent** (`defaultPublishOptions.persistent: true`) so they survive a RabbitMQ restart if they already reached a queue.

Code lives in `packages/common/src/messaging/` (`MessagingModule`, `EventPublisher`, `Events`).

### How a message is consumed

1. Only services that care subscribe. Inventory does; cart does not yet.
2. A class uses `@RabbitSubscribe(eventSubscribe('inventory.order.created', Events.ORDER_CREATED))`.
3. `eventSubscribe()` sets: durable queue, bind to `core-platform` with that routing key, dead-letter exchange on failure.
4. `prefetchCount: 1` — the consumer takes **one** message at a time (back-pressure under load). More inventory processes = competing consumers on the same queue.

### Success vs failure

```
Handler succeeds  →  ACK  →  message deleted from the queue
Handler throws    →  NACK (not requeued)  →  dead-letter exchange `core-platform.dlx`
                                              →  queue `core-platform.dlq`
```

Failed messages are **not** retried in a loop (that would block the main queue with poison messages). They wait in **`core-platform.dlq`**. Open http://localhost:15672 → Queues → `core-platform.dlq` to inspect or replay.

If the **consumer process crashes** before ack, the message stays in the main queue and is delivered again when inventory restarts.

If the **connection to Rabbit drops**, `amqp-connection-manager` reconnects (heartbeat 5s, retry every 3s). Nest apps still start if Rabbit is down (`wait: false`); `/api/health` will show Rabbit as down.

### What is still not guaranteed

Topic exchanges **do not store** a message unless a queue is already bound. If you publish `order.created` **before inventory has ever been started**, there is no `inventory.order.created` queue yet and the message is dropped. Start consumers at least once (or keep them running) so queues exist.

There is no delayed “retry 5 times then DLQ” loop. Fail once → DLQ.

### Events in this repo

| Event | Publisher | Consumer |
|---|---|---|
| `user.created` / `user.updated` | user-service | none yet |
| `product.created` | product-service | inventory (stock row, qty `0`) |
| `order.created` | order-service | inventory (reserve) |
| `order.cancelled` | order-service | inventory (release) |

To add an event: name + payload in `packages/common/src/messaging/events.ts`, `publish` in the producer, `@RabbitSubscribe(eventSubscribe('your-queue', Events.YOUR_EVENT))` only on the consumer.


## Error handling

Nest’s built-in layer is enough. There is no custom global filter.

**1. Validation (`ValidationPipe`)**  
Bad or extra JSON fields → **400**. DTOs in `dto/` use `class-validator`.

**2. Domain errors**  
Services throw `NotFoundException`, `UnauthorizedException`, `ConflictException`, etc. Nest maps those to the matching status.

**3. Mongo unique index**  
Every service wraps writes with `mongoWrite()` from common. Duplicate email / sku / cart / inventory → **409**. Cart create races use `isDuplicateKey()` then re-read; concurrent cart saves retry on `isVersionError()`. Uncaught errors still → **500**.

## Health

- `GET /api/health/live` — process is up
- `GET /api/health` and `GET /api/health/ready` — Mongo ping, plus RabbitMQ if `MessagingModule` is loaded

Apps still **start** if RabbitMQ is down (`connectionInitOptions.wait: false`). Ready checks fail until Compose is up.

## Environment

Copy `.env.example` → `.env` in each app (`.env` is gitignored). Re-copy after this change so `JWT_SECRET` is present.

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `MONGO_URI` | `mongodb://localhost:27017/users` | This service’s database |
| `RABBITMQ_URL` | `amqp://localhost:5672` | Event bus |
| `JWT_SECRET` | (16+ chars; 32+ in production) | Token signing/verification |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `CORS_ORIGIN` | `*` or `https://app.example.com` | Allowed browser origins |
| `NODE_ENV` | `production` | Requires Mongo, Rabbit, and a 32-char secret |

`ConfigModule` loads `apps/<service>/.env` then workspace `.env`.

## How Nx fits

Nx is **not** required by Nest. In this repo it:

- Discovers projects from `apps/*` and `packages/*` workspaces
- Runs webpack `build` then Node `serve`
- Caches builds and can run many apps with `run-many`

You do not replace Nest modules with Nx. You use Nx to run those Nest apps.

## Adding a new service

1. Generate under `apps/`: `npx nx g @nx/nest:app --name=payment-service --directory=apps/payment-service --e2eTestRunner=none --linter=eslint --unitTestRunner=none`
2. Point `database.module.ts` at `databaseImports({ envFile: 'apps/payment-service/.env', defaultMongoUri: 'mongodb://localhost:27017/payments' })`
3. `main.ts`: `bootstrapNestApp(AppModule, { defaultPort: 3005 })`
4. Feature module (`payments/`) with controller, service, dto, schema
5. Import `AuthModule` after `DatabaseModule`. Import `MessagingModule` only if it publishes or subscribes
6. Add `.env.example` and a workspace `package.json` `nx` `build` `outputs` of `{projectRoot}/dist` so serve finds `main.js`

## Repo map

| Path | Purpose |
|---|---|
| `apps/*` | Deployable Nest services |
| `packages/common` | `@core-platform/common` — `bootstrap/`, `config/`, `database/`, `auth/`, `health/`, `messaging/` |
| `docker-compose.yml` | Local Mongo + RabbitMQ |
| `nx.json` | Nx plugins (webpack, eslint, typescript) |
| `tsconfig.base.json` | Shared TypeScript strict settings |
