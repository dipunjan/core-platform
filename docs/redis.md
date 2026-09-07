# Redis — shared memory (not the database)

**For newcomers:** Redis is like a very fast sticky note board all five APIs share. It remembers things for **seconds or minutes** — rate limit counters, “this logged-out token is dead,” and copies of the product catalog. If Redis restarts, you lose those notes. You do **not** lose orders, carts, or users — those live in **MongoDB**.

Local: `docker compose up -d` → port **6379**. Each API `.env`: `REDIS_URL=redis://localhost:6379`. Health: `/api/health/ready` pings Redis.

Browser HTTP cache (**304**) is a different thing — [performance.md](performance.md).

---

## Three jobs Redis does in swoop

### 1. Rate limits (all five APIs)

Every request hits `ThrottlerGuard` → Redis `MULTI` (increment + check TTL).

| Endpoint | Limit |
|----------|-------|
| Login / register | 5 per minute |
| Refresh | 10 per minute |
| Checkout | 10 per minute |
| Other requests | 120 per minute (default) |

**Why Redis?** If each API kept its own counter in memory, five processes = five times the allowed guesses. Redis = **one bucket** for all instances.

**If Redis is down:** limits **fail open** (requests allowed). Shop stays up; login is easier to hammer.

### 2. Logout denylist (all APIs read; user-service writes)

A JWT access token is valid until `exp` (~15 min) even after logout — unless we remember it is dead.

On logout: hash the access token → Redis key until `exp`.

**If Redis is down:** denylist **fail open** — logged-out token may work until natural expiry.

### 3. Catalog cache (product-service only)

Public GETs for products, categories, storefront:

- Check Redis first (~**45 second** TTL).
- Admin writes **bump a generation number** — old cache keys ignored instantly.
- Keys look like `swoop:catalog:<gen>:products:all:0`.

**If Redis is down:** reads go straight to Mongo (slower, still correct).

---

## What we deliberately do NOT put in Redis

| Tempting idea | Why not |
|---------------|---------|
| Carts | Losing Redis would empty bags — Mongo is truth |
| Orders | Same — money data must survive Redis restart |
| Stock counts | Wrong count = oversell or false “out of stock” — Mongo + Rabbit |
| Full session store | JWT lets each API verify without Redis on every auth check |

Guest cart lives in the **browser** until login — [architecture.md](architecture.md).

---

## Key names (prefix `swoop:`)

| Key pattern | Purpose |
|-------------|---------|
| `swoop:throttle:…` | Rate limit counters |
| `swoop:deny:<sha256>` | Revoked access JWT |
| `swoop:catalog:gen` | Generation counter |
| `swoop:catalog:<gen>:<name>` | Cached JSON blob |

Never store plain passwords or raw refresh tokens in Redis.

---

## How to explain this in an interview

**Why Redis?**  
“Three shared concerns across five processes: rate limits, logout denylist, and short catalog cache. Not a second database.”

**Is Redis the source of truth?**  
“No. Mongo is. Redis is OK to lose — it rebuilds from Mongo or counters reset.”

**Why not cache carts in Redis?**  
“If Redis flushed, we would not want empty carts or lost orders. Catalog cache is safe to lose for 45 seconds; money data is not.”

**Redis down — what happens?**  
“Health may report down. Throttle and denylist fail open for availability. Catalog hits Mongo. Documented tradeoff.”

**Session vs Redis here?**  
“We use JWT cookies for identity. Redis is a helper for throttle and logout — not ‘who is logged in’ on every request.”

Future improvements: [roadmap.md](roadmap.md).
