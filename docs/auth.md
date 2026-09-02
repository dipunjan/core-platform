# Auth

Access token + refresh token. There is no login page — clients call HTTP.

- **Access token** (~15m, `JWT_SECRET`) — `Authorization: Bearer …` on every service
- **Refresh token** (~7d, `JWT_REFRESH_SECRET`) — user-service only; never send it as Bearer

Every service imports `AuthModule`. That installs a global `JwtAuthGuard`. Routes without `@Public()` return **401** if the access token is missing, expired, or a refresh JWT.

Cart and orders use `token.sub` (Mongo user id). They never take a user id from the URL or body.

One active refresh per user. Login or refresh **rotates** it (SHA-256 stored on the user). Logout clears that hash.

## Public vs authenticated

| | Public | Needs Bearer access token |
|---|---|---|
| user-service | `POST /api/users`, `POST /api/auth/login`, `POST /api/auth/refresh` | `GET/PATCH/DELETE /api/users/me`, `POST /api/auth/logout` |
| product-service | `GET /api/products`, `GET /api/products/:id` | create / update / delete |
| inventory-service | `GET /api/inventory`, `GET /api/inventory/:productId` | set quantity, reserve, release |
| cart-service | — | all `/api/carts*` |
| order-service | — | all `/api/orders*` |
| every service | `/api/health`, `/live`, `/ready` | — |

## Flow

```
  Client
    │  POST /api/users  or  POST /api/auth/login
    ▼
  user-service
    │  ← accessToken (~15m) + refreshToken (~7d)
    │
    │  later:  Authorization: Bearer <accessToken>
    ▼
  Any service  ── JwtAuthGuard ──►  401  or  handler runs
    │
    │  when access expired:
    │  POST /api/auth/refresh   { "refreshToken": "..." }
    ▼
  user-service
    │  ← new access + new refresh  (old refresh is dead)
    │
    │  POST /api/auth/logout   Bearer <access>
    ▼
  user-service   stored refresh hash cleared
```

Payload: `{ sub, email, typ }` — `typ` is `access` or `refresh`.

## How the guard works

```
  Incoming request
    │
    ├─ @Public() ?  ──────────────────────────────► allow  (login, health, catalog GET, …)
    │
    ├─ no Bearer header  ─────────────────────────► 401
    │
    ├─ jwt.verify(JWT_SECRET) fails / expired  ───► 401
    │
    ├─ typ is "refresh"  ─────────────────────────► 401  (refresh is not Bearer)
    │
    └─ typ is "access"  ── request.user = { sub, email }  ► handler
```

user-service **signs** access (`JWT_SECRET`) and refresh (`JWT_REFRESH_SECRET`). Other services only **verify** access.

## How to test

Mongo + Rabbit up, `user-service` running on 3000. For product/cart/order calls, start those services too.

### 1. Register (also returns tokens)

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","name":"Ada","password":"secret12"}'
```

Password min **8**. Duplicate email → **409**.

### 2. Sign in

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"secret12"}'
```

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": "15m",
  "user": { "id": "<id>", "email": "ada@example.com", "name": "Ada" }
}
```

Wrong password → **401**.

```bash
ACCESS=<paste accessToken>
REFRESH=<paste refreshToken>
```

### 3. Protected call without a token (expect 401)

```bash
curl -i http://localhost:3000/api/users/me
```

### 4. Profile with access token

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $ACCESS"
```

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace"}'
```

### 5. Refresh (expect new pair; old refresh fails)

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

Save the new tokens, then call refresh again with the **old** `$REFRESH` — expect **401**.

Do not put the refresh token in `Authorization`. That is also **401**.

### 6. Sign out

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS"
```

Then refresh with the last refresh token — expect **401**.

### 7. Same access token on other services

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Classic Tee","description":"Cotton","price":1299,"sku":"TEE-001"}'

curl http://localhost:3003/api/carts \
  -H "Authorization: Bearer $ACCESS"

curl -X POST http://localhost:3004/api/orders \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<productId>","quantity":1,"unitPrice":1299}]}'
```

`POST /api/orders` has no `userId` field. The order is stored with `userId = token.sub`.

Env: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN` (`15m`), `JWT_REFRESH_EXPIRES_IN` (`7d`). Same `JWT_SECRET` on every service.
