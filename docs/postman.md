# Postman

Live **demo script** for an interview: prove login, catalog writes, cart, order, and that Rabbit updated stock — without a frontend. Files in `postman/`. SPA behavior is different (cookies, no JSON tokens) — [frontend.md](frontend.md).

**One sentence:** import the collection + local environment, Register/Login with `X-Auth-Response: tokens`, collection auth is Bearer, walk Health → Auth → Products → Inventory → Cart → Orders.

Postman uses **Bearer**, so **CSRF does not apply**. That is what a mobile client would do too.

## What to say while you click

- Environment selected = URLs and tokens substitute. If you forget it, `{{userUrl}}` is empty — classic live-demo fail.
- Register **409** means that email exists → Login, don’t panic.
- After Create product, wait a beat then Get inventory — you are showing the **async** event, not a JOIN.
- Create order has **no `userId`** — “the API takes it from the token.”
- Refresh **changes both tokens** — save them; old refresh 401s.
- Logout last so the rest of the run still has a Bearer. After logout, Me may still work until access expires; Refresh will not.

## 1. Start the stack

```bash
docker compose up -d
npx nx serve user-service
npx nx serve product-service
npx nx serve inventory-service
npx nx serve cart-service
npx nx serve order-service
```

Start **inventory-service** before you create products so `product.created` has a queue.

## 2. Import

1. Postman → **Import**
2. `postman/Core-Platform.postman_collection.json`
3. `postman/Core-Platform.postman_environment.json`
4. You should see collection **Core Platform** and environment **Core Platform - Local**

## 3. Select the environment

Top-right → **Core Platform - Local**.

| Variable | Default | Notes |
|---|---|---|
| `email` / `password` / `name` | `ada@example.com` / `secret12` / `Ada` | Password min 8 |
| `sku` | `TEE-001` | Change if create product 409 |
| `accessToken` / `refreshToken` | empty | Filled by Register / Login / Refresh |
| `productId` / `orderId` | empty | Filled by Create product / Create order |

## 4. Happy path (demo order)

1. **Health → Live** — user-service is up
2. **Auth → Register** (or Login on 409) — scripts save tokens because of `X-Auth-Response: tokens`
3. **Users → Me** — profile, no password
4. **Products → Create** — saves `productId`. Then **Inventory → Get by product id** (qty 0)
5. **Inventory → Set quantity** — `50`
6. **Cart → Add item**
7. **Orders → Create** — `reserved` increases
8. **Orders → Cancel** — reserved drops

**Auth extras:** Refresh (save new pair). Logout last.

## 5. Collection runner

**Run** collection with environment **Core Platform - Local**. Register/Login first. Skip Logout until the end.

## 6. If it 401s

- Environment not selected
- Register/Login failed
- Access expired (~15m) → Refresh
- Refresh JWT sent as Bearer → always 401; refresh is **body only**
- Forgot `X-Auth-Response: tokens` on login → body has no JWTs, env tokens stay empty
