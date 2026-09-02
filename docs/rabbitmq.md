# RabbitMQ

HTTP is the public API. Mongo is each service’s database. RabbitMQ is the **async bus** so services do not call each other over HTTP for side effects (stock, etc.).

Local broker: `docker compose up -d` → AMQP `localhost:5672`, UI http://localhost:15672 (`guest` / `guest`).

## Flow

```
Client
  │  POST /api/orders
  ▼
order-service  ──save──►  Mongo DB `orders`
  │
  │  EventPublisher.publish(Events.ORDER_CREATED, payload)
  ▼
RabbitMQ exchange `core-platform`  (topic, durable)
  routing key: order.created
  │
  ▼
queue `inventory.order.created`  (durable, prefetch 1)
  │
  ▼
inventory-service  @RabbitSubscribe  ──update──►  Mongo DB `inventory`
```

Same pattern for `product.created` (inventory creates a stock row) and `order.cancelled` (inventory releases reserved stock).

## Events in this repo

| Event | Publisher | Consumer |
|---|---|---|
| `user.created` / `user.updated` | user-service | none yet |
| `product.created` | product-service | inventory (stock row, qty `0`) |
| `order.created` | order-service | inventory (reserve) |
| `order.cancelled` | order-service | inventory (release) |

## Publish

1. Import `MessagingModule` in `app.module.ts`.
2. Inject `EventPublisher`.
3. After a successful Mongo write: `this.events.publish(Events.ORDER_CREATED, payload)`.
4. Publishes to exchange `core-platform` with the event name as the **routing key**.
5. Messages are **persistent**.

Code: `packages/common/src/messaging/`.

## Consume

1. Only services that care subscribe. Inventory does; cart does not.
2. `@RabbitSubscribe(eventSubscribe('inventory.order.created', Events.ORDER_CREATED))`.
3. Durable queue, bind to `core-platform`, dead-letter exchange on failure.
4. `prefetchCount: 1`. More inventory processes = competing consumers on the same queue.

## Success vs failure

```
Handler succeeds  →  ACK  →  message deleted
Handler throws    →  NACK (not requeued)  →  exchange `core-platform.dlx`
                                              →  queue `core-platform.dlq`
```

Poison messages wait in **`core-platform.dlq`**. UI: Queues → `core-platform.dlq`.

- Process crash **before** ack → message stays on the main queue and is redelivered.
- Connection drop → `amqp-connection-manager` reconnects (heartbeat 5s, retry 3s). Apps still **start** if Rabbit is down (`wait: false`); `/api/health/ready` shows Rabbit down.

## Not guaranteed

Topic exchanges **do not store** a message unless a queue is already bound. If you publish `order.created` before inventory has ever started, there is no queue yet and the message is **dropped**. Start inventory at least once (or keep it running).

No “retry 5 times then DLQ”. Fail once → DLQ.

## Add an event

1. Name + payload in `packages/common/src/messaging/events.ts`
2. `publish` in the producer
3. `@RabbitSubscribe(eventSubscribe('your-queue', Events.YOUR_EVENT))` on the consumer only

## How to test

Start Mongo + Rabbit, then **inventory-service** first (creates queues), then product-service and order-service. You need a valid access token ([auth](auth.md)).

### 1. Queues exist

Open http://localhost:15672 → Queues. After inventory has booted you should see:

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

Copy the product `_id`, then:

```bash
curl http://localhost:3002/api/inventory/<productId>
```

Expect `quantity: 0`, `reserved: 0`. Set stock:

```bash
curl -X PUT http://localhost:3002/api/inventory/<productId> \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"quantity":50}'
```

### 3. `order.created` → reserved stock

```bash
curl -X POST http://localhost:3004/api/orders \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<productId>","quantity":2,"unitPrice":1299}]}'
```

`GET /api/inventory/<productId>` — `reserved` should be `2`.

### 4. `order.cancelled` → release

```bash
curl -X PATCH http://localhost:3004/api/orders/<orderId>/status \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"status":"cancelled"}'
```

`reserved` should drop back.

### 5. Dropped message (no consumer yet)

Stop inventory, create a product, start inventory. That product may have **no** inventory row — the event was published with no queue bound. That is expected for a topic exchange.

Env: `RABBITMQ_URL=amqp://localhost:5672`.
