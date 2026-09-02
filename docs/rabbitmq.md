# RabbitMQ

How services talk **without HTTP to each other**. Interview framing + how to demo. Broker locally: `docker compose up -d` → AMQP `:5672`, UI http://localhost:15672 (`guest` / `guest`).

**One sentence:** the browser only uses HTTP; after an order (or product) is saved, we publish a persistent message on topic exchange `core-platform`; inventory consumes it and updates stock.

## What to say

**Why not `order-service` HTTP-calling `inventory-service`?**  
That couples checkout latency and uptime to stock. If inventory is restarting, place-order would 502. A queue holds `order.created` until inventory is back. Tradeoff: **eventual consistency** — the order row exists before `reserved` bumps (usually ms).

**What if the message is lost?**  
Topic exchange **drops** the message if **no queue is bound yet**. That is why we start inventory before creating products in a demo. Once the durable queue exists, messages wait. Failed handler → NACK → DLQ (`core-platform.dlq`), not infinite retry.

**At-least-once?**  
Crash before ACK → redelivery. Inventory reserve is designed to be safe to retry (idempotent keys). Say “at-least-once + idempotent consumer,” not exactly-once (that needs more infra).

**Who subscribes?**  
Only services that care. Cart does not listen. Inventory listens to product + order events. `user.created` is published with **no consumer** — placeholder for email/CRM; say that honestly.

**Scale?**  
`prefetchCount: 1`. Extra inventory replicas = competing consumers on the same queue name.

**HTTP vs events (whiteboard)**  
UI → order-service (sync, user waits). order-service → Rabbit → inventory (async, user does not wait on stock).

## Sequence (order → stock)

```
  Client
    │  POST /api/orders   Bearer <access>
    ▼
  order-service  ──save──►  Mongo DB `orders`
    │
    │  EventPublisher.publish(order.created)
    ▼
  RabbitMQ exchange `core-platform`   (topic, durable)
    routing key: order.created
    │
    ▼
  queue `inventory.order.created`
    │
    ▼
  inventory-service  ──update──►  Mongo  then ACK
```

Same shape: `product.created` → inventory row qty `0`. `order.cancelled` → release reserved.

## Events in this repo

| Event | Publisher | Consumer |
|---|---|---|
| `user.created` / `user.updated` | user-service | none yet |
| `product.created` | product-service | inventory (row, qty `0`) |
| `order.created` | order-service | inventory (reserve) |
| `order.cancelled` | order-service | inventory (release) |

## Publish / consume (implementation)

Publish after a **successful** Mongo write: `this.events.publish(Events.ORDER_CREATED, payload)`. Routing key = event name. Persistent messages.

Consume: `@RabbitSubscribe(eventSubscribe('inventory.order.created', Events.ORDER_CREATED))`. Durable queue, DLX on failure.

Code: `packages/common/src/messaging/`.

## Success vs failure

```
  Handler succeeds  →  ACK   →  message deleted
  Handler throws    →  NACK (not requeued)
                         ▼
                   exchange `core-platform.dlx`
                         ▼
                   queue `core-platform.dlq`
```

UI: Queues → `core-platform.dlq`. Crash **before** ack → redeliver on the main queue. Disconnect → reconnect (heartbeat 5s). Apps **start** even if Rabbit is down (`wait: false`); `/api/health/ready` shows Rabbit down.

No “retry 5 times then DLQ” — fail once → DLQ.

## Add an event

1. Name + payload in `packages/common/src/messaging/events.ts`
2. `publish` in the producer app
3. `@RabbitSubscribe` only on the consumer that needs it

## How to test

Start Mongo + Rabbit, **inventory-service first** (binds queues), then product and order. Need an access token ([auth](auth.md)).

### 1. Queues exist

http://localhost:15672 → Queues, after inventory boot:

- `inventory.product.created`
- `inventory.order.created`
- `inventory.order.cancelled`
- `core-platform.dlq`

### 2. `product.created` → inventory row

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Classic Tee","description":"Cotton","price":1299,"sku":"TEE-001"}'
```

```bash
curl http://localhost:3002/api/inventory/<productId>
```

Expect `quantity: 0`, `reserved: 0`. Then `PUT` quantity `50` with Bearer.

### 3. `order.created` → reserved

```bash
curl -X POST http://localhost:3004/api/orders \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<productId>","quantity":2,"unitPrice":1299}]}'
```

`reserved` should be `2`.

### 4. Cancel → release

```bash
curl -X PATCH http://localhost:3004/api/orders/<orderId>/status \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"status":"cancelled"}'
```

### 5. Dropped message (talk track)

Stop inventory, create a product, start inventory. That product may have **no** inventory row — published with no bound queue. Expected for a topic exchange.

Env: `RABBITMQ_URL=amqp://localhost:5672`.
