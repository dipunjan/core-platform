# Core Platform

This folder is the **shop backend** plus a small **React website** in `apps/web`.

The website talks to the five APIs. It keeps you logged in with **cookies** (not `localStorage`).

## Which file should I read?

| I want to… | Open |
|---|---|
| Understand the whole project | This file |
| Understand login, cookies, Bearer, CSRF | [docs/security.md](docs/security.md) |
| Understand stock updates after an order | [docs/rabbitmq.md](docs/rabbitmq.md) |
| Build the website | `apps/web` and [docs/frontend.md](docs/frontend.md) |
| Put this on the internet | [docs/deploy.md](docs/deploy.md) |
| See shared code used by every service | [docs/common.md](docs/common.md) |
| Click through the APIs in Postman | [docs/postman.md](docs/postman.md) |

## Simple picture

Instead of one big program, there are **five small programs**. Each one does one job and has its own database.

```
  You (browser or Postman)
           │
           │  normal web requests (HTTP)
           ▼
   user     product    inventory    cart     orders
   :3000    :3001      :3002        :3003    :3004
           │
           ├── MongoDB     (saves data)
           └── RabbitMQ    (passes notes between programs)
```

| Program | Port | What it stores | Like this page on a shop |
|---|---|---|---|
| user-service | 3000 | Accounts and login | Sign in, my profile |
| product-service | 3001 | Product list | Home, product page |
| inventory-service | 3002 | How many are in stock | “In stock” |
| cart-service | 3003 | Your cart | Cart |
| order-service | 3004 | Your orders | Checkout, my orders |

Anyone can **look at products** without logging in (like Amazon). Cart, checkout, and “my profile” need a login.

When you place an order, the order program saves it, then **sends a message** (RabbitMQ) so the stock program can hold those items. The website does not wait for stock in that same click — it happens a moment later.

Login uses two passes:

- a **short** one (~15 minutes) for each request
- a **long** one (~7 days) only to get a new short one when the short one expires

The website should keep those in **cookies**, not in `localStorage`. Details: [docs/security.md](docs/security.md).

## A customer’s path

1. Open the catalog — no login.
2. Register or log in — cookies are set.
3. Load “me” to show the name in the header.
4. Add to cart.
5. Place an order. Stock is reserved shortly after, via a message.
6. If a request says “not logged in” (401), ask for a new short pass, then try again.
7. Log out. The long pass is thrown away. The short one may still work for a few minutes.

## Run it on your computer

```bash
npm install

cp apps/user-service/.env.example apps/user-service/.env
cp apps/product-service/.env.example apps/product-service/.env
cp apps/inventory-service/.env.example apps/inventory-service/.env
cp apps/cart-service/.env.example apps/cart-service/.env
cp apps/order-service/.env.example apps/order-service/.env

docker compose up -d
# Starts the database (Mongo) and the message broker (RabbitMQ).
# Rabbit web UI: http://localhost:15672  user guest, password guest

npx nx serve user-service
npx nx serve product-service
npx nx serve inventory-service
npx nx serve cart-service
npx nx serve order-service
npx nx serve web                 # http://localhost:5173
```

The shop site is **http://localhost:5173**. APIs must be running too. Create a product in Postman if the home page is empty.

Start **inventory** before you create products, so stock rows can be created automatically.

Check it is up:

```bash
curl http://localhost:3000/api/health/live
```

## Settings (`.env`)

Copy `.env.example` to `.env` in each app. Do not commit real secrets.

| Name | Meaning |
|---|---|
| `PORT` | Which port this program listens on |
| `MONGO_URI` | Where this program’s data lives |
| `RABBITMQ_URL` | Where messages go (`amqp://localhost:5672`) |
| `JWT_SECRET` | Secret for the short pass — **must be the same** in every app |
| `JWT_REFRESH_SECRET` | Secret for the long pass |
| `JWT_ACCESS_EXPIRES_IN` | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGIN` | Which website is allowed to call the API (your frontend URL) |
| `COOKIE_SECURE` | `false` on http://localhost; `true` on https |
| `NODE_ENV=production` | Stricter rules (real secrets, real website URL) |

## If something goes wrong

| Code | Meaning |
|---|---|
| 400 | Bad input (missing field, extra field) |
| 401 | Not logged in, or pass expired |
| 403 | Browser cookie login missing a security header (CSRF) |
| 404 | Not found |
| 409 | Email or product code already used |
| 429 | Too many login tries; wait a minute |
| 500 | Server bug |

`/api/health/live` = the program is running. `/api/health/ready` = it can talk to the database (and messages, if it uses them).

## Folders

```
apps/user-service     login and users
apps/product-service  products
apps/inventory-service  stock
apps/cart-service     carts
apps/order-service    orders
packages/common       shared start-up, login check, messages
apps/web              React shop (Vite, port 5173)
docs/                 guides
postman/              click-to-run API collection
```
