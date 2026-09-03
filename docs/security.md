# Security

How login works, how Postman and the website send it, and what that means for attackers. How to click through APIs: [postman.md](postman.md). How the shop UI is built: [frontend.md](frontend.md). Going live: [deploy.md](deploy.md).

## Two passes (JWTs)

After login you get two strings. That *is* the login.

| Pass | Lasts | Used for |
|---|---|---|
| **Access** | about 15 minutes | Cart, orders, profile, anything that needs “it’s you” |
| **Refresh** | about 7 days | Only to get a **new** access pass when the old one expires |

Every program checks the access pass with the same secret (`JWT_SECRET`). Refresh is only handled by **user-service**. The database stores a **hash** of the refresh pass (like a password), not the raw string.

The pass contains your user id (`sub`). Cart and orders use that. **Do not send `userId` in the body** — the server ignores a fake one.

Logout throws away the stored refresh and clears cookies. The old access pass may still work until its ~15 minutes are up. That is normal for this design.

Login/register: 5 tries per minute. Refresh: 10 per minute.

## Two envelopes (same pass)

The API accepts **either** cookies **or** `Authorization: Bearer …`. One request uses one of them.

**Website (browser)** — cookies  
The server sets cookies. The browser sends them to *this* API by itself. Shoppers never copy a token. Access and refresh cookies are **HttpOnly**: JavaScript on the page cannot read them. Do **not** put tokens in `localStorage` (a hostile script on the page could steal them).

**Postman (and curl)** — Bearer  
Not a shopper’s browser, so Register/Login with header `X-Auth-Response: tokens` put the strings in JSON. You paste `Authorization: Bearer <access>`. That is a normal way to test.

## “If Postman can do it, can a hacker too?”

**Yes — if they have the same token (or your password).** The server does not know Postman from a script. Whoever sends a valid access pass *is* you.

What they **cannot** do: sit on another laptop with no password and no token and “just use Postman” on your account. They would need to:

- guess your password (slowed by the per-minute limit), or
- steal the token (malware, a leaked Postman export, a screenshot, XSS if you stored it in `localStorage`, …)

So Postman is not a hole. **Leaking the token** is the hole. Treat Bearer tokens like a password: don’t commit them, don’t paste them in Slack, don’t put them in the website’s `localStorage`.

The shop uses cookies so the page never holds the access/refresh strings in JavaScript.

## Why not `localStorage` or a classic session? (textbook)

You always need **some** proof after login. The question is only **where it lives**.

| Where | Textbook? | Why |
|---|---|---|
| **`localStorage` / `sessionStorage`** | No for a real shop | Any script that runs on your page can read it and send it like Postman. Tutorials do this because it is easy, not because it is safe. |
| **Classic session cookie** | Yes for **one** server | Browser gets a random id (`abc123`). The **server** remembers “abc123 = Ada” in Redis/memory. Logout is instant (delete the row). All five of our programs would need that **same** session store on every request. |
| **JWT in an HttpOnly cookie** (this project) | Yes for **several APIs** | Each program checks the short pass with `JWT_SECRET`. No shared “who is logged in” database on cart/orders/products. Refresh is still stored (hashed) so you can kill the long pass. |

Textbook for **this** shape (five APIs + a React shop):

1. **Do not** put access/refresh in `localStorage`.
2. Put them in **HttpOnly + Secure + SameSite** cookies (we use `lax`; `Secure` on HTTPS).
3. Keep the **access** pass short (~15 minutes) so a stolen one dies quickly.
4. Keep **refresh** hashed on the user service and **rotate** it.
5. Add **CSRF** (or a BFF) because cookies are sent automatically.
6. Use **Bearer** only for Postman, mobile apps, or other servers — not for the shop page.

A bigger production shop sometimes adds a **BFF** (one backend-for-frontend): the browser only has a session cookie; that one program talks to the five APIs with tokens. Same idea (browser never holds JWTs). We skipped the extra program and put the JWTs in cookies instead.

**Session vs JWT** is not “secure vs insecure.” Session = server remembers you (easy revoke, extra Redis). JWT cookie = each API can check the pass itself (fits microservices; revoke of the short pass waits until it expires).

## Extra check for the browser (CSRF)

The browser **always attaches cookies** to requests to your API. A *different* website could try to make **your** browser place an order.

So cookie logins that **change** data (POST, PATCH, PUT, DELETE) also need header `X-CSRF-Token` matching the readable `csrf_token` cookie. That cookie **is** readable by JavaScript on purpose (so *your* site can copy it). A random other site should not have it.

Bearer requests skip CSRF (Postman does not need this header).

## Cookies (names)

| Cookie | Can JS read it? | Where it is sent |
|---|---|---|
| `access_token` | no | whole site |
| `refresh_token` | no | only `/api/auth` (refresh and logout) |
| `csrf_token` | **yes** | whole site (so the site can copy it into a header) |

On your laptop, `COOKIE_SECURE=false` (HTTP). On HTTPS, set it `true`.

## Who may call you (CORS)

Only listed website URLs (`CORS_ORIGIN`). In production you cannot use “allow everyone” (`*`). That stops a random page in the browser from calling your API with the shopper’s cookies. It does **not** stop Postman or a script that already has a Bearer token — those are not browser CORS.

## What needs a login?

| | No login | Login needed |
|---|---|---|
| Users | register, login, refresh | my profile, logout |
| Products | list, get one | create / edit / delete |
| Stock | list, get one | set amount, reserve, release |
| Cart | — | everything |
| Orders | — | everything |
| Health | `/api/health/live` and `/ready` | — |

Looking at products does **not** need a pass. To test logout, use “my profile” or “refresh”, not “get product”.

## Step by step

1. Register or login. Cookies are set. JSON shows tokens only if you asked with `X-Auth-Response: tokens`.
2. Call APIs with the access pass (header or cookie).
3. When access expires, `POST /api/auth/refresh`. You get a **new access and a new refresh**. The old refresh stops working.
4. Logout clears the stored refresh and cookies.

## Try it (curl — need Mongo + user-service)

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d '{"email":"ada@example.com","name":"Ada","password":"secret12"}'
```

Password at least 8 characters. Same email twice → **409**.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d '{"email":"ada@example.com","password":"secret12"}'
```

```bash
ACCESS=...
REFRESH=...

curl -i http://localhost:3000/api/users/me
curl http://localhost:3000/api/users/me -H "Authorization: Bearer $ACCESS"

curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Response: tokens' \
  -d "{\"refreshToken\":\"$REFRESH\"}"

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS"
```

Same `$ACCESS` on profile can still work until it expires. Old `$REFRESH` should fail.

```bash
curl http://localhost:3003/api/carts -H "Authorization: Bearer $ACCESS"
```
