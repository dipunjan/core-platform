# Auth

Access token + refresh token. There is no login page — clients call HTTP.

- **Access token** (~15m, `JWT_SECRET`) — `Authorization: Bearer …` **or** HttpOnly cookie `access_token`
- **Refresh token** (~7d, `JWT_REFRESH_SECRET`) — JSON body **or** HttpOnly cookie `refresh_token` (path `/api/auth` only). Never send it as Bearer.

## Textbook flow

1. **Login / register** → `accessToken` (short) + `refreshToken` (long). Also set as cookies (see below).
2. Call APIs with `Authorization: Bearer <accessToken>` (Postman, mobile) **or** with cookies (`credentials: 'include'` in a browser).
3. When access expires (401), `POST /api/auth/refresh` with the **same** refresh token (body or cookie) → **new access token**. The refresh token **does not change**.
4. **Logout** deletes the stored refresh hash and clears cookies. That refresh token cannot mint access anymore. A Bearer access token still works until `exp`.

Refresh rotation (a new refresh on every refresh call) is a later security add-on, not this flow.

## Cookies (browser)

Same idea as a session cookie: JavaScript cannot read the tokens (`HttpOnly`). Use `fetch(..., { credentials: 'include' })`. Do **not** copy tokens into `localStorage` — that is what XSS steals.

| Cookie | HttpOnly | Secure | SameSite | Path |
|---|---|---|---|---|
| `access_token` | yes | yes in production (`COOKIE_SECURE` / `NODE_ENV`) | `Lax` | `/` |
| `refresh_token` | yes | same | `Lax` | `/api/auth` |

`SameSite=Lax` blocks most cross-site POSTs (CSRF). CORS allows credentials. For a real SPA, set `CORS_ORIGIN` to that app’s origin (not `*`). Behind HTTPS set `COOKIE_SECURE=true`.

JSON still returns tokens so Postman and native apps keep working. A browser should ignore those fields and rely on cookies.

Local HTTP: `COOKIE_SECURE=false` or omit it (Secure is off unless `NODE_ENV=production`).

## Public vs authenticated

| | Public | Needs access token (Bearer or cookie) |
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
    │  ← JSON tokens + Set-Cookie (HttpOnly)
    │
    │  later:  Authorization: Bearer <accessToken>
    │      or  Cookie: access_token=…
    ▼
  Any service  ── JwtAuthGuard ──►  401  or  handler runs
    │
    │  when access expired:
    │  POST /api/auth/refresh   { "refreshToken": "..." }
    ▼
  user-service
    │  ← new accessToken  (same refreshToken)
    │
    │  POST /api/auth/logout
    ▼
  user-service   refresh hash cleared, cookies cleared
                 Bearer access JWT still works until exp
```

Payload: `{ sub, email, typ }` — `typ` is `access` or `refresh`.

## How the guard works

```
  Incoming request
    │
    ├─ @Public() ?  ──────────────────────────────► allow  (login, health, catalog GET, …)
    │
    ├─ no access token (Bearer or cookie)  ────────► 401
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

### 5. Refresh (new access; same refresh)

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

`accessToken` is new. `refreshToken` is unchanged — use the same `$REFRESH` again. Put only the access token in `Authorization`.

### 6. Sign out

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS"
```

Then:

```bash
curl -i http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $ACCESS"
```

Expect **200** until the access token expires. Refresh with the old `$REFRESH` → **401**. `GET /api/products/:id` is public and does not care about tokens.

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

Env: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN` (`15m`), `JWT_REFRESH_EXPIRES_IN` (`7d`), `CORS_ORIGIN`, `COOKIE_SECURE`. Same `JWT_SECRET` on every service.
