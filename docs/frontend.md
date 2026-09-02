# Frontend (not in this repo)

This backend is ready for a **separate SPA** (React, Next, Vue, etc.). There is no UI here on purpose: interviewers can ask how you would consume the APIs. This file is that contract.

Use it as a build list. Pair with [auth.md](auth.md) for cookie flags and [deploy.md](deploy.md) for the production host.

## What to say

**Why no UI in this repo?**  
The assignment is the platform: services, auth, events. The SPA is a client. You can still talk through every screen (catalog, login, cart, checkout).

**How does the browser stay logged in?**  
`credentials: 'include'`, HttpOnly cookies, `X-CSRF-Token` from the readable `csrf_token` cookie, refresh on 401, never `localStorage` for JWTs.

**Five localhost ports vs production?**  
Dev can call five URLs. Prod: proxy `/api` on the same host as the SPA (or a gateway) so cookies stay first-party. See [deploy.md](deploy.md).

## Role split

| Layer | Owns |
|---|---|
| Frontend | Screens, routing, forms, calling APIs, CSRF header, refresh-on-401, **never** storing JWTs in `localStorage` |
| This backend | Passwords, tokens, cart/order data, stock, events |
| Production | One API host (gateway) + one web host (or Next SSR). See [deploy.md](deploy.md) |

The frontend is a **client of five HTTP APIs** (locally five origins; in production one `https://api.example.com`).

## What you must build (screens)

| Screen | Backend calls | Auth |
|---|---|---|
| Home / catalog | `GET {productUrl}/products` | Public |
| Product detail | `GET /products/:id` + `GET {inventoryUrl}/inventory/:productId` | Public |
| Register | `POST {userUrl}/users` | Public, cookies set |
| Login | `POST {userUrl}/auth/login` | Public, cookies set |
| Header / account | `GET {userUrl}/users/me` | Cookie or Bearer |
| Cart | `GET/POST/PATCH/DELETE {cartUrl}/carts…` | Required |
| Checkout | `POST {orderUrl}/orders` `{ items: [{ productId, quantity, unitPrice }] }` | Required; **no `userId` in body** |
| Orders | `GET /orders`, `GET /orders/:id`, cancel via status patch | Required |
| Admin (optional) | Product create/patch, `PUT /inventory/:id` | Required (no roles in API yet — treat as same login) |

Local URLs: user `http://localhost:3000/api`, product `3001`, inventory `3002`, cart `3003`, order `3004`. All paths already include the `/api` prefix on the server (`/users`, `/auth/login`, …).

## Auth you must implement

**Browser (recommended for the interview SPA)**

1. `fetch` / axios with `credentials: 'include'` on **every** call to the API origin(s).
2. Do **not** send `X-Auth-Response: tokens`. Ignore any token fields if present. Use cookies the server sets.
3. After login, read cookie `csrf_token` (JavaScript can read it; access/refresh are HttpOnly).
4. On `POST`, `PATCH`, `PUT`, `DELETE` to the API, send header `X-CSRF-Token: <csrf_token value>`.
5. On **401** from a protected route: `POST /auth/refresh` with credentials (refresh cookie path is `/api/auth`, so the request URL must be user-service `/api/auth/refresh`). Then **retry** the original request once.
6. Logout: `POST /auth/logout` with credentials + CSRF. Clear any UI user state. Do not assume access is dead if you also had a Bearer token lying around.

**If you skip cookies and use Bearer (mobile-style)**

- Login with header `X-Auth-Response: tokens`.
- Keep access (memory) + refresh (memory or secure storage — **not** `localStorage` if you can avoid it).
- `Authorization: Bearer <access>` on APIs.
- Refresh: body `{ "refreshToken" }`, then replace **both** tokens (rotation).
- No CSRF header.

Do not mix: if you send Bearer, CSRF is skipped; if you rely on cookies, you need CSRF.

## CORS and cookies

- Dev: add the SPA origin to every service `CORS_ORIGIN` (e.g. `http://localhost:5173`). Restart APIs.
- `SameSite=Lax` cookies: SPA and API on **different ports** of `localhost` still work. Different **sites** in production need a gateway so API and maybe app share a parent domain, or you stay cross-site and then cookies are harder (`SameSite=None; Secure` — not what this API sets today).
- **Interview line:** “For production I would put an API gateway on `api.example.com` and the SPA on `www.example.com`, pin CORS, HTTPS, `COOKIE_SECURE=true`.” Cross-site cookies with `Lax` will **not** send on `fetch` from `www` to `api` on another site — so either **same-site subdomain** (`app.example.com` + `api.example.com` is actually same-site) or a **BFF** on the same origin as the SPA.

Same-site: `https://shop.example.com` (UI) + `https://api.shop.example.com` (gateway) counts as same-site (schemeful same-site: eTLD+1 `shop.example.com`). Adjust cookie `Domain` if you need to share across subdomains — **today cookies are host-only**; a gateway on the same host the browser calls is the simplest fix (UI talks only to `https://shop.example.com/api/...` proxied to Nest).

**Simplest frontend prod pattern:** Next.js (or Nginx) on one host, **proxy** `/api` to the gateway. Then cookies are first-party, no CORS.

## HTTP helper (what to write)

```
function api(path, options) {
  return fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': readCookie('csrf_token'),
      ...options.headers,
    },
  });
}
```

Refresh interceptor: if status === 401 and path is not `/auth/login`, call refresh once, then retry. If refresh 401, redirect to login.

## State and UX

- Catalog can be fetched without auth; cart icon shows login CTA if `GET /users/me` is 401.
- After add-to-cart, refetch cart; optimistic UI is optional.
- Checkout: show that stock reserve is **async**. Optional: poll inventory or refetch order after 1s. Do not block the UI forever.
- Map API errors: 400 field errors on forms, 409 “email/sku taken”, 429 “try later”.
- There is **no role field** in the JWT. Hide admin product forms unless you add roles later.

## Out of scope for the first frontend

- Payment (Stripe) — would be a new service + redirect/return URLs
- Guest cart (merge on login) — API cart is always the logged-in user
- SSR user from HttpOnly cookie in Next — possible; `users/me` on the server needs to forward cookies
- Websocket stock updates — use HTTP GET inventory for now

## Local frontend env example

```
VITE_USER_API=http://localhost:3000/api
VITE_PRODUCT_API=http://localhost:3001/api
VITE_INVENTORY_API=http://localhost:3002/api
VITE_CART_API=http://localhost:3003/api
VITE_ORDER_API=http://localhost:3004/api
```

In production, one `VITE_API=https://shop.example.com/api` (proxied) is better than five URLs.
