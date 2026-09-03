# Messages (RabbitMQ)

The website talks to our programs with normal web requests.

The programs also talk to **each other**, but not with those same web requests. They leave **notes** in a mailbox called RabbitMQ. The stock program reads those notes and updates how many items are left.

On your machine: `docker compose up -d`. Web UI: http://localhost:15672 (user `guest`, password `guest`).

## Why a mailbox?

If the **order** program called the **stock** program directly:

- placing an order would fail whenever stock is restarting
- the customer would wait for stock on the same click

With a mailbox:

- the order is saved first
- a note “order created” is left in the box
- stock reads it when it can (usually right away)

The order exists a tiny moment before stock is held. That is OK for this shop.

## What notes we send

| Note | Who writes it | Who reads it | What happens |
|---|---|---|---|
| product created | product program | stock | creates a stock row, amount 0 |
| order created | order program | stock | holds (reserves) the items |
| order cancelled | order program | stock | puts the items back |
| user created / updated | user program | nobody yet | later you could send a welcome email |

The cart program does not listen. It does not need these notes.

## Important: start stock first

If you create a product **before** the stock program has ever started, the note has nowhere to sit and is **thrown away**. So in a demo, start inventory-service first. After it has started once, the mailbox (queue) exists and notes wait.

If handling a note **crashes**, the note goes to a “failed” box: `core-platform.dlq` in the Rabbit web UI. We do not retry forever.

If the program dies **before** it says “I got it”, the note is given again. Stock updates are written so doing them twice is safe.

## Picture

```
  You place an order
        │
        ▼
  order program saves the order
        │
        │  leaves a note “order created”
        ▼
  RabbitMQ (the mailbox)
        │
        ▼
  stock program reads the note
        │
        ▼
  stock numbers go up in “reserved”
```

## Try it

Need a login pass ([security](security.md)). Start Mongo, Rabbit, **inventory**, then product and orders.

1. Open http://localhost:15672 → Queues. You should see names starting with `inventory.` and `core-platform.dlq`.

2. Create a product (need access pass). Then get stock for that product id. Amount should be 0. Then set amount to 50.

3. Place an order for 2 of that product. Stock “reserved” should become 2.

4. Cancel the order. Reserved should go back down.

If you stop inventory, create a product, then start inventory — that product may have **no** stock row. The note was lost. Start inventory first next time.
