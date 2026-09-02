# Postman

Import two JSON files from `postman/`. They cover all five services. Register and Login scripts write `accessToken` and `refreshToken` onto the environment so later requests send Bearer automatically.

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

## 2. Import into Postman

1. Open Postman (desktop or web).
2. **Import** (top left) → **Upload files** (or drag).
3. Select both:
   - `postman/Core-Platform.postman_collection.json`
   - `postman/Core-Platform.postman_environment.json`
4. Confirm import. You should see collection **Core Platform** and environment **Core Platform - Local**.

## 3. Select the environment

Top-right dropdown → **Core Platform - Local**.

If this is skipped, `{{userUrl}}` and `{{accessToken}}` stay empty and requests fail.

Check **Environments** → Core Platform - Local. You can edit:

| Variable | Default | Notes |
|---|---|---|
| `email` / `password` / `name` | `ada@example.com` / `secret12` / `Ada` | Password min 8 |
| `sku` | `TEE-001` | Must be unique — change it if create product returns 409 |
| `accessToken` / `refreshToken` | empty | Filled by Register / Login / Refresh |
| `productId` / `orderId` | empty | Filled by Create product / Create order |

## 4. Run requests

Collection auth is Bearer `{{accessToken}}`. Login also sets HttpOnly cookies; Postman can ignore those and keep using the environment tokens.

Public routes (health, login, register, refresh, catalog GET) turn auth off.

**Happy path**

1. **Health → Live** — `{"status":"ok"}`. If this fails, user-service is not up.
2. **Auth → Register** — 200/201 with tokens. Environment now has `accessToken` and `refreshToken`. If **409**, that email exists → use **Login** instead, or change `email`.
3. **Users → Me** — your profile (not the password).
4. **Products → Create** — saves `productId`. Wait a second, then **Inventory → Get by product id** (qty 0 if inventory was running).
5. **Inventory → Set quantity** — `50`.
6. **Cart → Add item** — uses `productId`.
7. **Orders → Create** — saves `orderId`. Inventory `reserved` should increase.
8. **Orders → Cancel** — releases stock.

**Auth extras**

- **Refresh** — new `accessToken`; `refreshToken` is the same. You can Refresh again with it.
- **Logout** — needs current access token. Then Refresh 401. Login again for a new pair.

Send **Logout last**.

## 5. Collection runner (optional)

**Core Platform** → **Run** → pick environment **Core Platform - Local** → run **Auth → Register** (or Login) first, then Products / Inventory / Cart / Orders. Skip Logout until the end.

## 6. 401 / empty token

- Environment not selected.
- Register/Login not run (or failed).
- Access expired (~15m) → run **Refresh**, then retry.
- Refresh JWT used as Bearer → always 401. Refresh goes in the JSON body only.
