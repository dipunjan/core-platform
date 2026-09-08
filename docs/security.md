# Security — login, cookies, and checkout safety

**For newcomers:** Security here means proving *who you are* (login), stopping *other websites* from acting as you (CSRF + CORS), slowing *password guessing* (rate limits), and stopping *fake prices* at checkout (server-side pricing). Postman tests the same APIs with Bearer tokens instead of cookies — that is normal, not a back door.

Related: [redis.md](redis.md) (denylist, throttle) · [postman.md](postman.md) · [deploy.md](deploy.md) · gaps [roadmap.md](roadmap.md).

---

## Two passes after login (JWT)

Think of two tickets:

| Pass | Lifetime | Purpose |
|------|----------|---------|
| **Access** | ~15 minutes | Every API call — cart, orders, profile |
| **Refresh** | ~7 days | Only to get a **new** access pass when the old one expires |

- Every service checks access with the same `JWT_SECRET`.
- Only **user-service** handles refresh.
- Refresh is **hashed in Mongo** (like a password) — stealing the DB does not give usable refresh strings.
- The JWT contains your user id (`sub`). **Never trust `userId` in the request body.**

**Logout:** refresh deleted, cookies cleared, access token **denylisted in Redis** until it would have expired. If Redis is down, access may still work until `exp` (~15 min).

**Rate limits (Redis):** login/register 5/min, refresh 10/min, checkout 10/min. Behind a gateway set `TRUST_PROXY=true` so limits use the real client IP.

---

## Website cookies vs Postman Bearer

| | Shop (browser) | Postman |
|--|----------------|---------|
| How login is sent | HttpOnly cookies (auto) | `Authorization: Bearer <access>` |
| Can page JavaScript read token? | **No** (HttpOnly) | N/A |
| CSRF header needed? | Yes on POST/PATCH/DELETE | No |

Register/Login with header `X-Auth-Response: tokens` returns tokens in JSON for Postman.

### Why not `localStorage`?

Any script on your page can read `localStorage` and send tokens like Postman. Tutorials use it because it is easy — not because it is safe for a real shop.

### Session vs JWT (textbook)

| Approach | Good for | Our choice |
|----------|----------|------------|
| Classic session cookie | One server; server remembers you in Redis every request | We use Redis only for denylist + throttle |
| JWT in HttpOnly cookie | Several APIs; each verifies signature locally | **This project** |

We did **not** put the whole login in Redis sessions — that would mean every cart/order call hits Redis just to know who you are.

---

## CSRF — why the extra header?

Cookies ride along automatically. A malicious site could try to POST an order using your cookies.

**Fix:** mutating requests from the shop also send `X-CSRF-Token` matching the readable `csrf_token` cookie. Evil sites should not have that value.

| Cookie | JS can read? | Sent to |
|--------|--------------|---------|
| `access_token` | No | All API paths |
| `refresh_token` | No | `/api/auth` only |
| `csrf_token` | Yes | So our JS can copy it into the header |

`COOKIE_SECURE=false` on localhost; `true` on HTTPS in production.

---

## CORS

Only URLs in `CORS_ORIGIN` may call the API **from a browser with cookies**. Production forbids `*`.

CORS does **not** block Postman or curl — only browser cross-origin rules.

---

## Checkout and order security

| Attack | Defense |
|--------|---------|
| Fake `unitPrice` in browser | Client sends `productId` + `quantity` only; order-service reads live price from product-service |
| Double-click place order | `Idempotency-Key` header + unique index `{ userId, idempotencyKey }` |
| Fake `userId` in body | Ignored — identity from JWT `sub` only |
| Non-admin edits catalog | `@Roles('admin')` on write routes |

Also: `helmet()`, `ValidationPipe` (whitelist + forbid extra fields), bcrypt passwords, env validation stricter in production.

---

## What needs login?

| Area | Public | Needs login |
|------|--------|-------------|
| Products, categories, storefront GET | Yes | Admin writes |
| Cart API | — | Always (keyed by user id) |
| Cart on website | Guest view in browser | Merge on sign-in |
| Orders | — | Own orders; admin sees all |
| Health | `/api/health/live`, `/ready` | — |

---

## Try it (curl)

```bash
# Register (needs phone + address)
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d '{"email":"ada@example.com","name":"Ada","password":"secret12","phone":"5550100","address":{"line1":"123 Market St","city":"San Francisco","region":"CA","postalCode":"94103","country":"US"}}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d '{"email":"ada@example.com","password":"secret12"}'
```

Use `$ACCESS` as `Authorization: Bearer $ACCESS` for cart/orders. Refresh with `POST /api/auth/refresh` and body `{ "refreshToken": "$REFRESH" }`.

---

## How to explain this in an interview

**Can Postman hack the API?**  
“Only with a valid token or password — same as any HTTP client. Postman is not special access; leaking the token is the risk. The shop uses HttpOnly cookies so JavaScript never holds tokens.”

**How do you stop price tampering?**  
“order-service calls product-service at checkout. The browser never sends `unitPrice`.”

**How do you stop double orders?**  
“Optional `Idempotency-Key` header plus a unique Mongo index per user. Retries return the same order.”

**Session or JWT?**  
“JWT in HttpOnly cookies so all five services can verify locally. Redis only for logout denylist and rate limits — not a full session store.”

**Is it bank-grade secure?**  
“Solid MVP patterns: Stripe/Razorpay use hosted fields and webhook signature verification; secrets stay server-side. Gaps: no full PCI audit, no WAF, Redis fail-open on outage. See roadmap.”
