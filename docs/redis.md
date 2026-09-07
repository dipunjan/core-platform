# Redis

Redis is a **fast shared memory** the five APIs all talk to. It is **not** the shop database.

Mongo still owns users, products, carts, orders, and stock. RabbitMQ still carries “something happened” notes. Redis holds things that are **short-lived**, **shared across processes**, and **OK to lose** (they rebuild).

Local: `docker compose up -d` starts Redis on **6379**. Each API `.env` has `REDIS_URL=redis://localhost:6379`. `/api/health/ready` pings Redis.

## When we use it (and why)

| Use | Where | Why Redis | What goes wrong without it |
|---|---|---|---|
| **Login / request rate limits** | All APIs (`ThrottlerGuard`) | Counters must be **one bucket** for every instance of every service | In-memory limits reset on restart. Five processes = five times the guesses. A brute-force login could rotate across ports. Uses Redis `MULTI` (incr + pttl) so counts stay consistent under concurrency. |
| **Logout of the access JWT** | user-service writes; every API reads (`JwtAuthGuard`) | A JWT is valid until `exp`. Mongo can kill **refresh**, but cart/orders never see that row | After logout the short pass still worked for ~15 minutes. Redis stores a **denylist** key until that pass would have expired. |
| **Catalog / storefront cache** | product-service public GETs | Home and shop hit the same lists constantly | Extra Mongo load. Cache TTL is ~45s. Writes **bump a generation** so old keys are ignored. |

## When we do **not** use it

| Tempting idea | Why not |
|---|---|
| **Source of truth for carts or orders** | Flush Redis (or a restart without AOF) would empty someone’s bag or lose a purchase. Those stay in Mongo. Guest cart stays in the **browser** until login. |
| **Stock / reserved quantity** | A missed key looks like “infinite stock” or “none left.” Inventory stays in Mongo; RabbitMQ updates it. Redis is a cache, not a ledger. |
| **Classic server session as the only login** | That would force **every** API to call Redis on every request just to know who you are. JWTs let each API check `JWT_SECRET` itself. Redis only stores “this access pass was logged out.” |
| **Permanent product records** | Same as carts: Mongo is the catalog. Redis is a **copy** that expires. |

## Issues Redis does **not** fix

- **Wrong CORS / CSRF** — still a browser/cookie problem.
- **RabbitMQ down** — orders still save; stock still will not reserve until the note is read. Redis does not replace the mailbox.
- **Stale shop UI for ~45 seconds** after an admin edits a product — that is the cache TTL. Bump on write avoids *long* staleness; it does not make Mongo+Redis a single atomic view.
- **If Redis is down** — health/ready shows Redis `down`. Rate limits **fail open** (requests pass). Denylist **fail open** (a logged-out access pass may work until it expires, like before). Catalog reads go straight to Mongo. The shop still runs; logout is less sharp and login is easier to hammer.

## Keys (prefix `swoop:`)

- `swoop:throttle:…` — hit counters
- `swoop:deny:<sha256 of access token>` — logged-out access pass
- `swoop:catalog:<generation>:<name>` — product/category/storefront JSON
- `swoop:catalog:gen` — incremented on catalog writes

Do not store passwords or raw refresh tokens in Redis. Refresh stays **hashed in Mongo**.
