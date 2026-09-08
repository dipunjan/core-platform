# Postman

Postman is a clickable tool to call the APIs **without the shop website**. Use it to check login, products, cart, and orders.

The shop (http://localhost:5173) uses **cookies**. Postman uses **Bearer tokens** (same login, different envelope). Why that is not a free pass for strangers: [security.md](security.md). How the website is built (TanStack Query, zod forms): [frontend.md](frontend.md).

Each API also documents routes at **`/api/docs`** (Swagger UI). Use **Authorize → Bearer** with `accessToken` from Login.

**HTTP codes and 304:** [performance.md](performance.md).

## Before you start

1. Run Docker (Mongo + Redis + Rabbit) and all five programs. See the main [README](../README.md).
2. Start **inventory** before you create products.

## Import

1. In Postman click **Import**.
2. Add:
   - `postman/Core-Platform.postman_collection.json`
   - `postman/Core-Platform.postman_environment.json`
3. Top right, pick environment **Core Platform - Local**.

If you skip the environment, addresses stay empty and everything fails.

## What the environment stores

| Name | Meaning |
|---|---|
| email / password / name | Test user (password at least 8 characters) |
| sku | Product code — change it if “already exists” |
| accessToken / refreshToken | Filled after Register or Login |
| productId / orderId | Filled after you create them |

Register and Login send `X-Auth-Response: tokens` so the **body includes tokens**. Scripts save them. Later requests send `Authorization: Bearer …` automatically.

## Click this order

1. **Health → Live** — user program is up
2. **Auth → Register** — needs phone + address JSON. If email already exists (409), use **Login**
3. **Users → Me** — your profile (no password)
4. **Products → Create** — wait a second
5. **Inventory → Get by product id** — amount 0, then set amount to 50
6. **Cart → Add item**
7. **Orders → Create** — `productId` + `quantity` only (price comes from product-service). Optional header `Idempotency-Key` for safe retries. Include `shippingAddress`; stock “reserved” should go up
8. **Payments → Checkout** then **Simulate pay** (or use Stripe/Razorpay test keys + webhooks) — order status becomes `paid`
9. **Orders → Cancel** — reserved goes down (pending orders only)

**Refresh** gives new tokens — keep both. **Logout** last, or the rest of the run has no pass.

Treat saved tokens like a password. Don’t commit the environment file if it has real tokens.

## If you get 401

- Environment not selected
- You did not Register/Login, or it failed
- Access pass older than ~15 minutes → run **Refresh**
- You put the refresh pass in Authorization — that always fails. Refresh goes in the **JSON body**
- Login without `X-Auth-Response: tokens` — body has no tokens, so nothing was saved

## Status codes in Postman

| Code | Meaning |
|------|---------|
| 200 | Success — you got JSON (or empty body for DELETE). |
| 304 | **Not an error.** “Nothing changed since last time.” Postman may show this if you repeat a GET with caching on. Ignore it or disable cache in Postman. The shop browser uses 304 more often. |
| 401 | Not logged in or token expired → Login or Refresh. |
| 403 | CSRF (browser only) or not admin. Postman Bearer calls usually skip CSRF. |
| 429 | Too many requests — wait a minute (login/checkout limits). |

Full list and why APIs feel slow after restart: [performance.md](performance.md).
