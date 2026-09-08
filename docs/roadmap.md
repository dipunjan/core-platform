# Roadmap — what we built vs what comes next

**For newcomers:** This project is **interview-ready patterns** on **demo scope**. You can demo a real shopper flow, but you cannot take card payments yet. In interviews, say what works, then point here for honest gaps.

---

## One sentence

**Production-ready patterns, MVP scope** — auth, outbox, server pricing, idempotency, event-driven stock are real. Payments, tracing, and HA uploads are not.

---

## Summary

| Area | Built today | Not built |
|------|-------------|-----------|
| Auth | HttpOnly cookies, CSRF, JWT, bcrypt, refresh rotation | MFA, OAuth, full IAM |
| Frontends | TanStack Query (server state + session), react-hook-form + zod, OpenAPI `/api/docs` on each API | Redux (removed — not needed), E2E tests, CI |
| Abuse | Redis rate limits | WAF, CAPTCHA |
| Checkout | Server pricing, idempotency, price snapshot | **Stripe / PCI / refunds** |
| Orders → stock | Outbox, Rabbit, idempotent consumer, DLQ | Saga / reserve-before-commit |
| Cache | Redis catalog ~45s; browser 304 | CDN, read replicas |
| Files | Local disk branding uploads | S3 + CDN, virus scan |
| Deploy | Checklist in [deploy.md](deploy.md) | Gateway/K8s in repo |
| Ops | Health live/ready | Metrics, tracing, alerts |

Details live in topic docs — do not duplicate: [security.md](security.md) · [performance.md](performance.md) · [redis.md](redis.md) · [rabbitmq.md](rabbitmq.md) · [frontend.md](frontend.md).

---

## Frontend stack (shop + admin)

| Built | Still on roadmap |
|-------|------------------|
| **TanStack Query** — catalog, cart, orders, auth session, admin CRUD | Automated tests (Vitest / Playwright) |
| **react-hook-form + zod** — login, register, checkout, account; admin login + product/category forms | Full zod on every admin screen (e.g. branding promos still manual) |
| **OpenAPI** at `http://localhost:<port>/api/docs` per service | API gateway in repo |
| Shared **`Field`** UI; **`AddressFields`** supports `register` or controlled mode | — |

**No Redux.** Server-backed state lives in the React Query cache (`QueryClientProvider` in `main.tsx`). See [frontend.md](frontend.md).

---

## Payments (the big missing piece)

Today: order status = **placed**, not **paid**.

| To add | Why |
|--------|-----|
| Stripe (or similar) payment intent | Capture real money |
| Webhook + idempotency | Provider retries notifications |
| `pending_payment` → `paid` states | Correct UX |
| Refunds | Admin/support |
| Hosted card fields | Keep PCI scope small |

**Say in interview:** “Checkout creates an order with server-validated price. Payment would be a provider webhook updating order status — not in this repo.”

---

## Security gaps

| Have | Need later |
|------|------------|
| CSRF, CORS, helmet, validation | WAF, fraud scoring |
| `@Roles('admin')` | Full RBAC beyond `ADMIN_EMAIL` |
| Redis denylist | Fail-closed option if compliance requires |
| 2MB upload mime check | Malware scan, S3 policies |

---

## Performance gaps

| Have | Need later |
|------|------------|
| Catalog Redis cache | CDN for images |
| Stateless APIs | Autoscaling + load tests |
| Mongo indexes | Read replicas at scale |

---

## Observability gaps

| Missing | Why it matters |
|---------|----------------|
| Request correlation id | Trace checkout across 5 services |
| Prometheus / Grafana | SLOs |
| OpenTelemetry | order → outbox → Rabbit → inventory |
| Alerting | On-call |

**Say:** “Health endpoints exist; next step is OpenTelemetry in shared bootstrap.”

---

## Infrastructure gaps

| Piece | Status |
|-------|--------|
| API gateway (one HTTPS host) | Documented, not in repo |
| Kubernetes / Terraform | Not included |
| Hosted HA Mongo/Redis/Rabbit | You bring in production |
| CI/CD | Not in these docs |
| OpenAPI in repo | **Done** — `/api/docs` on each API via shared bootstrap |

---

## Tradeoffs we accept (say them aloud)

| Choice | We picked | Stricter option |
|--------|-----------|-----------------|
| Stock timing | Order first, reserve ~2s later | Reserve before confirm (saga) |
| Redis outage | Fail open on throttle/denylist | Fail closed |
| Catalog edits | Up to ~45s stale on shop | Push invalidation / shorter TTL |
| Events | Outbox only on orders | Outbox on every publisher |

Failure matrix: [architecture.md](architecture.md).

---

## Before real users (minimum)

1. HTTPS + `COOKIE_SECURE=true`
2. Secrets 32+ chars in a vault — same `JWT_SECRET` in all five APIs
3. Hosted Mongo **replica set**, Redis, Rabbit with backups
4. One public API URL + `TRUST_PROXY=true`
5. Explicit `CORS_ORIGIN`
6. `PRODUCT_SERVICE_URL` on order-service

Full deploy guide: [deploy.md](deploy.md). Still no payments until you integrate a provider.

---

## How to explain this in an interview

**Is it production-ready?**  
“Patterns are solid for a small shop MVP — I would not claim PCI or full observability. I know exactly what I would add next: payments, gateway, tracing.”

**What would you build first after MVP?**  
“Payment webhooks, API gateway for one HTTPS host, OpenTelemetry, S3 for uploads, then CI + E2E tests.”

**Why ship without payments?**  
“Focused on order integrity — outbox, pricing, idempotency — before integrating Stripe.”
