# Auth

How login works in this project — for a full-stack interview. There is **no login page** in this repo; the frontend (or Postman) calls HTTP. Cookie/CSRF details for a SPA: [frontend.md](frontend.md). Curl at the bottom.

**One sentence:** short access JWT (~15m) plus long refresh (~7d); browsers use HttpOnly cookies + CSRF; Postman uses Bearer; every service **verifies** access with the same `JWT_SECRET`; only user-service **signs** refresh.

## What to say

**Why two tokens?**  
Access is sent on every API call. If it leaks, the window is ~15 minutes. Refresh is used rarely, stored hashed on the server, and **rotated**. That is the standard OAuth-resource-server story.

**Why not only refresh, or only sessions in Redis?**  
Five Nest apps must authorize without calling user-service on each request. A signed JWT is verified locally. A classic Redis session would make every service depend on that store (also valid — say you’d pick Redis if you needed instant logout everywhere).

**Why cookies and Bearer?**  
Browser: `HttpOnly` so XSS cannot `document.cookie` the JWTs. Native/Postman: `Authorization: Bearer`. JSON includes tokens **only** if `X-Auth-Response: tokens` — otherwise a SPA that saved the body to `localStorage` would undo HttpOnly.

**Why CSRF?**  
The browser **auto-sends** cookies. A hostile site could `POST` to our API with the user’s cookies. `SameSite=Lax` blocks most of that; we also require `X-CSRF-Token` = `csrf_token` cookie on cookie-authenticated writes. Bearer is not auto-sent by other sites, so CSRF is skipped.

**Why rotate refresh?**  
If someone steals an old refresh, using it after a legitimate refresh **mismatches the hash** → we delete the stored hash (reuse detection). The thief and the real user both lose the refresh; they must log in again.

**Why logout does not 401 `/users/me` immediately?**  
Access is stateless. We do not keep a denylist. Logout clears refresh + cookies. Stolen Bearer still works until `exp`. Say: “I’d add `tokenVersion` or a denylist if product required kill-switch.”

**Who is the user?**  
`token.sub` (Mongo id). Cart and orders **never** take `userId` from the body. That is an IDOR answer.

**Public catalog?**  
Shop browse without an account. Logout cannot “break” `GET /products/:id` — that route is `@Public()`. Test logout on `/users/me` or `/auth/refresh`, not on catalog GET.

## Flow

1. Register / login → Set-Cookie `access_token`, `refresh_token`, `csrf_token`. JSON tokens only with `X-Auth-Response: tokens`.
2. APIs: Bearer **or** cookies (`credentials: 'include'`). Cookie writes: `X-CSRF-Token`.
3. Access expired → `POST /api/auth/refresh` → **new access and new refresh**. Old refresh → 401.
4. Logout → refresh hash gone, cookies cleared. Bearer access until `exp`.

Limits: login/register **5/min**, refresh **10/min**, other **120/min**, health not throttled.

## Cookies

| Cookie | HttpOnly | Secure | SameSite | Path | JS can read? |
|---|---|---|---|---|---|
| `access_token` | yes | prod / `COOKIE_SECURE` | Lax | `/` | no |
| `refresh_token` | yes | same | Lax | `/api/auth` | no |
| `csrf_token` | **no** | same | Lax | `/` | **yes** (needed for header) |

CORS: explicit origins. `*` in development → localhost list. Production forbids `*`. Local HTTP: `COOKIE_SECURE=false`.

## Public vs authenticated

| | Public | Needs access (Bearer or cookie) |
|---|---|---|
| user-service | `POST /users`, `POST /auth/login`, `POST /auth/refresh` | `GET/PATCH/DELETE /users/me`, `POST /auth/logout` |
| product-service | `GET /products`, `GET /products/:id` | create / update / delete |
| inventory-service | `GET /inventory`, `GET /inventory/:productId` | set qty, reserve, release |
| cart-service | — | all `/carts*` |
| order-service | — | all `/orders*` |
| every service | `/health`, `/live`, `/ready` | — |

## Sequence

```
  Client
    │  POST /api/users  or  POST /api/auth/login
    ▼
  user-service
    │  ← Set-Cookie (HttpOnly + csrf)
    │     JSON tokens only if X-Auth-Response: tokens
    │
    │  later:  Authorization: Bearer <accessToken>
    │      or  Cookie + X-CSRF-Token on writes
    ▼
  Any service  ── JwtAuthGuard ──►  401 / 403  or  handler runs
    │
    │  when access expired:
    │  POST /api/auth/refresh
    ▼
  user-service
    │  ← new access + new refresh  (old refresh dead)
    │
    │  POST /api/auth/logout
    ▼
  user-service   refresh hash cleared, cookies cleared
                 Bearer access still works until exp
```

Payload: `{ sub, email, typ }` — `typ` is `access` or `refresh`. Refresh JWT as Bearer → **401**.

## Guard (what each service runs)

```
  Incoming request
    │
    ├─ @Public() ?  ──────────────────────────────► allow
    │
    ├─ no access token (Bearer or cookie)  ────────► 401
    │
    ├─ jwt.verify(JWT_SECRET) fails / expired  ───► 401
    │
    ├─ typ is "refresh"  ─────────────────────────► 401
    │
    ├─ cookie auth + POST/PATCH/PUT/DELETE,
    │   missing/wrong X-CSRF-Token  ──────────────► 403
    │
    └─ request.user = { sub, email }  ────────────► handler
```

user-service **signs** access (`JWT_SECRET`) and refresh (`JWT_REFRESH_SECRET`). Other services only **verify** access. Same `JWT_SECRET` on every service or they cannot trust the token.

## How to test

Mongo + Rabbit up, `user-service` on 3000. Other services for cart/orders/products.

### 1. Register

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d '{"email":"ada@example.com","name":"Ada","password":"secret12"}'
```

Without that header: body has `user` / `expiresIn` only; tokens still in `Set-Cookie`. Password min **8**. Duplicate email → **409**.

### 2. Sign in

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
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

### 3. No token → 401

```bash
curl -i http://localhost:3000/api/users/me
```

### 4. Profile

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

### 5. Refresh (both tokens change)

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

Save **both**. Old `$REFRESH` then **401**.

### 6. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS"
```

`GET /users/me` with the same Bearer → **200** until `exp`. Refresh with old refresh → **401**. `GET /products/:id` stays public.

### 7. Same access on other services

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

No `userId` on the order body — stored as `token.sub`.

Env: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN` (`15m`), `JWT_REFRESH_EXPIRES_IN` (`7d`), `CORS_ORIGIN`, `COOKIE_SECURE`.
