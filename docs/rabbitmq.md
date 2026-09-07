# RabbitMQ — messages and the transactional outbox

**For newcomers:** When you place an order, we must (1) save the order in Mongo and (2) tell the stock service to reserve items. If we call Rabbit directly inside the HTTP handler and Rabbit fails, the order exists but stock never moves. The **outbox pattern** fixes that: save order + “please publish this message” row in **one Mongo transaction**; a background worker publishes later.

Redis: [redis.md](redis.md). Full journey: [architecture.md](architecture.md).

Local Rabbit UI: http://localhost:15672 (`guest` / `guest`).

---

## Why a message broker?

**Bad:** order-service HTTP-calls inventory-service during checkout.

- Checkout fails if stock service is down.
- Customer waits on the same click.

**Good:** order-service saves the order, drops a note in RabbitMQ, returns. inventory-service reads the note when ready (~2 seconds).

There is a small window: order exists before stock is reserved. Acceptable for this demo; tighter systems use reserve-before-commit (saga) — [roadmap.md](roadmap.md).

---

## Transactional outbox (orders only)

```
POST /orders
     │
     ▼
Mongo transaction (atomic)
  ├── insert order document
  └── insert outbox row (event payload + routing key)
     │
     ▼  HTTP returns — shopper sees "order placed"
Outbox relay (every ~2s, OUTBOX_POLL_MS)
     │
     ▼
RabbitMQ publish (3 retries per attempt)
     │
     ▼
inventory-service reserves stock
     │
     ▼
outbox row marked publishedAt
```

- Rabbit down? Rows stay in Mongo; relay retries.
- API restarts? Nothing lost.
- Product/user events still publish **directly** (lower risk). Only orders use outbox today.

---

## Events

| Event | Publisher | Consumer | Effect |
|-------|-----------|----------|--------|
| `PRODUCT_CREATED` | product-service | inventory | Create stock row (qty 0) |
| `ORDER_CREATED` | order-service (relay) | inventory | Increase `reserved` |
| `ORDER_CANCELLED` | order-service (relay) | inventory | Decrease `reserved` |
| `USER_CREATED` | user-service | none yet | Future: welcome email |

cart-service does not listen to Rabbit.

---

## Idempotency and DLQ

- **Duplicate delivery:** inventory handler checks “already reserved?” — safe to run twice.
- **Poison message:** goes to dead-letter queue `core-platform.dlq` — not infinite retry.
- **Start inventory first:** if product is created before inventory ever ran, `PRODUCT_CREATED` may be lost (queue did not exist). Demo tip: start inventory-service before creating products.

---

## Try it

1. Rabbit UI → Queues → names like `inventory.*` and `core-platform.dlq`.
2. Create product → set stock to 50.
3. Place order for 2 → `reserved` becomes 2 (~2s delay).
4. Cancel order → `reserved` drops.

---

## How to explain this in an interview

**Why RabbitMQ?**  
“Decouple checkout from stock. Order HTTP stays fast; inventory catches up async.”

**Why transactional outbox?**  
“Order commit and ‘publish event’ must not split. If Rabbit fails after Mongo commit without outbox, stock never updates. Outbox + relay fixes that.”

**How prevent overselling?**  
“Reserve on ORDER_CREATED. Small race before reserve — mention saga as upgrade.”

**What if the same message arrives twice?**  
“Idempotent inventory handler — check before incrementing reserved.”

**What if handling crashes?**  
“Message goes to DLQ after failures; we don’t loop forever.”

Future: outbox on all publishers, dedicated relay worker — [roadmap.md](roadmap.md).
