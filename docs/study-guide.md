# Study guide — your teacher for this project

Read the docs below **in order**. Each file is **complete on its own** — you should not need a separate “interview cheat sheet.” Every doc explains the topic in simple words and ends with **how to say it in an interview**.

## 30-second pitch (practice out loud)

> swoop is a small e-commerce platform: five NestJS microservices, two React frontends, MongoDB as source of truth, Redis for shared rate limits and short catalog cache, and RabbitMQ for async stock. Shoppers browse as guests, sign in at checkout, and place orders. Checkout uses **server-side pricing** and optional **Idempotency-Key**. Orders use a **transactional outbox** — order and event row commit together; a relay publishes to Rabbit so stock updates are not lost if the broker blips.

## System map (draw or say this)

```
Browser (:5173 shop or :5174 admin)
  → APIs :3000–3004
  → Mongo (users, products, carts, orders, stock, outbox)
  → Redis (throttle, logout denylist, ~45s catalog cache)
  → RabbitMQ (order/product events → inventory)
```

## Reading order

| Order | Doc | What you will master |
|-------|-----|----------------------|
| 1 | [README](../README.md) | Run it locally once |
| 2 | [architecture.md](architecture.md) | Whole system, shopper journey, services |
| 3 | [security.md](security.md) | Login, CSRF, checkout safety |
| 4 | [redis.md](redis.md) | What Redis does and does **not** do |
| 5 | [performance.md](performance.md) | HTTP codes, 304, slowness, caching |
| 6 | [rabbitmq.md](rabbitmq.md) | Outbox, stock messages |
| 7 | [roadmap.md](roadmap.md) | Honest gaps: payments, tracing, etc. |

Optional when you need them: [frontend.md](frontend.md) · [postman.md](postman.md) · [deploy.md](deploy.md) · [common.md](common.md) · [conventions.md](conventions.md).

## 5-minute demo (do this before an interview)

1. `docker compose up -d`
2. Start all five APIs + `nx serve web`
3. Browse `/shop` without login; add to cart
4. Checkout → register → place order
5. Rabbit UI (http://localhost:15672): message consumed; inventory `reserved` goes up
6. Admin `:5174` — edit a product; shop may lag ~45s (catalog cache)
7. Logout → cart API rejects old cookie (if Redis is up)

## Golden rule

**Say what we built, then what we would add next.** Never claim payments or full observability exist — that is all in [roadmap.md](roadmap.md).
