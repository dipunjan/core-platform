# Architecture

swoop is an Nx monorepo: **five NestJS APIs**, a **shop** (`apps/web`), and a **staff admin** (`apps/admin`). Shared start-up and auth live in `@core-platform/common`.

Prices are integer **minor units**. Display currency is `storefront.currency`. Login is **HttpOnly cookies + CSRF** (Postman may send Bearer).

## System

```mermaid
flowchart TB
  subgraph browsers [Browsers]
    Shop["Shop apps/web :5173"]
    Admin["Admin apps/admin :5174"]
  end
  Postman[Postman / curl]

  subgraph apis [HTTP /api]
    U["user-service :3000"]
    P["product-service :3001"]
    I["inventory-service :3002"]
    C["cart-service :3003"]
    O["order-service :3004"]
  end

  Mongo[(MongoDB)]
  Rabbit[[RabbitMQ]]

  Shop --> U & P & I & C & O
  Admin --> U & P & I & O
  Postman --> U & P & I & C & O

  U --> Mongo
  P --> Mongo
  I --> Mongo
  C --> Mongo
  O --> Mongo

  U --> Rabbit
  P --> Rabbit
  O --> Rabbit
  Rabbit --> I
```

Admin does not call cart-service. Guests keep a cart in the **browser** until login; then it is merged into cart-service.

## What each API owns

| App | Port | Mongo | HTTP | Events |
|---|---|---|---|---|
| user-service | 3000 | users | register, login, me, admin people | USER_CREATED / USER_UPDATED |
| product-service | 3001 | products, categories, storefront | catalog, storefront, **image files** | PRODUCT_CREATED |
| inventory-service | 3002 | stock | get / set quantity | listens: product created, order created/cancelled |
| cart-service | 3003 | carts | cart for a logged-in user | — |
| order-service | 3004 | orders | checkout, my orders, admin sales | ORDER_CREATED / ORDER_CANCELLED |

`packages/common`: `bootstrapNestApp`, JWT guards, `@Public` / `@Roles('admin')`, CORS, health, Rabbit publisher.

## Shopper path

```mermaid
sequenceDiagram
  actor Guest
  participant Shop
  participant Product as product-service
  participant CartAPI as cart-service
  participant User as user-service
  participant Order as order-service
  participant Rabbit as RabbitMQ
  participant Stock as inventory-service

  Guest->>Shop: browse /shop
  Shop->>Product: GET /products /categories /storefront
  Guest->>Shop: add to cart
  Note over Shop: guest lines in localStorage
  Guest->>Shop: checkout → login or register
  Shop->>User: POST /auth/login or POST /users
  Shop->>CartAPI: merge guest cart
  Guest->>Shop: place order + address
  Shop->>User: PATCH /users/me address
  Shop->>Order: POST /orders
  Order->>Rabbit: ORDER_CREATED
  Rabbit->>Stock: reserve quantity
```

## Frontend layers

Same folders in shop and admin:

```
URL → routes/router.tsx → pages → hooks → features (Redux) → api/http.ts → :3000–3004
```

Chrome is `Layout`. Gates are `ProtectedRoute` and `GuestRoute`. Render crashes: `components/ErrorBoundary` (around the tree) and `errorElement` → `RouteError` (inside the router, so the header/sidebar can stay).

## Folder map

```
apps/user-service        accounts
apps/product-service     products, categories, storefront + uploads
apps/inventory-service   on-hand / reserved
apps/cart-service        signed-in carts
apps/order-service       orders
packages/common          bootstrap, auth, messaging
apps/web                 shop UI
apps/admin               staff UI
docs/                    this file and the other guides
```
