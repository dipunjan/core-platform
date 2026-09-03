# Website (frontend)

The shop site lives in **`apps/web`**. It is a React app (Vite + Tailwind) at **http://localhost:5173**. The storefront is branded **swoop**.

It talks to the five APIs. Login is stored in **cookies**, not in `localStorage`. Why, and how Postman/Bearer fits: [security.md](security.md). Going live: [deploy.md](deploy.md).

## Run it

1. Start Mongo, RabbitMQ, and the five API programs (see the main README).
2. `npx nx serve web` (or `cd apps/web && npm run dev`)
3. Open http://localhost:5173

Each API `.env` must allow this site in `CORS_ORIGIN` (the examples already include `http://localhost:5173`).

If the home page is empty, create a product with Postman while **inventory-service** is running, then refresh.

## How a click becomes an API call

```
Browser URL
    → routes/router.tsx picks a page
    → the page uses a hook (useCart, useAuth, …)
    → the hook dispatches a Redux action
    → the slice calls axios (api/http.ts)
    → a backend on port 3000–3004
```

Redux only keeps a **copy** of data so the screen can re-render. The **real** cart, orders, and login live on the server. Your user id still comes from the cookie, not from Redux.

Prices from the API are **cents** (1299 → $12.99).

## URLs (routing)

Routing is **not** mixed into `App.tsx`. The list of pages is in **`src/routes/router.tsx`**. React Router reads that list and shows the matching page.

`App.tsx` only:

1. Asks “who am I?” once on load (`useAuth().loadMe()`).
2. Hands the router to the screen (`RouterProvider`).

The header is `Layout`. Two gates sit under it:

- **`ProtectedRoute`** — must be logged in. Otherwise go to `/login`.
- **`GuestRoute`** — must be logged *out*. If you already have a session (header shows your name), `/login` and `/register` send you home. The URL can still say `/login` for a moment; then it redirects. Being logged in and seeing the login form was a missing gate, not a second account.

| URL | Who can open it | Screen |
|---|---|---|
| `/` | Anyone | Product list |
| `/products/:id` | Anyone | One product, stock, add to cart |
| `/login` | Guests only | Sign in |
| `/register` | Guests only | Create account |
| `/cart` | Logged in | Cart, place order |
| `/orders` | Logged in | Order history, cancel pending |
| anything else | — | Redirects to `/` |

`:id` is the product’s database id (from the URL).

## Folders (what each one is for)

```
apps/web/src/
  main.tsx         starts React, wraps the app in the Redux store
  App.tsx          load current user, then start the router
  routes/          which URL shows which page
  pages/           one file per screen (puts hooks + components together)
  hooks/           “do this for me” functions pages call (login, load cart, …)
  features/        Redux slices (the actual server calls and saved copies)
  components/
    ui/            shared bits: Button, Field, Flash, EmptyState, Spinner
    layout/        Layout, ProtectedRoute (logged in), GuestRoute (logged out)
    catalog/       ProductCard
    cart/          CartLine
    orders/        OrderCard
  api/             axios client, API URLs, TypeScript types
  store/           Redux store + typed useAppDispatch / useAppSelector
  styles/          Tailwind (index.css)
```

Cross-folder imports use `@` (meaning `src/`) and a folder’s `index.ts` barrel, for example:

```ts
import { Button, ProductCard } from '@/components';
import { useCart } from '@/hooks';
import { money } from '@/api';
```

Files inside a folder still import siblings with `./` (a Button file does not go through `@/components`). Layout imports `@/components/ui`, not `@/components`, so it does not loop back on itself.

**Pages do not talk to axios.** They call hooks. Hooks talk to slices. Slices talk to `api/`.

| Hook | Used on | What it does |
|---|---|---|
| `useAuth` | App, Layout, login/register, product | Me, login, register, logout |
| `useCatalog` / `useProduct` | Home, product | Product list / one product + stock |
| `useCart` | Cart, product | Load cart, change qty, checkout |
| `useOrders` | Orders | List orders, cancel |

Checkout is: create an order, then delete the cart (that logic is in the cart slice, not in the page).

## Login on this site

`api/http.ts` sends cookies on every request (`withCredentials`).

On POST / PATCH / PUT / DELETE it also sends the `X-CSRF-Token` header (read from the readable `csrf_token` cookie). That is required for cookie logins. [security.md](security.md) explains why.

If a call comes back **401** and you still have a `csrf_token` cookie (you were logged in, but the short pass expired), axios calls `/auth/refresh` **once** and retries. If that fails, the site treats you as logged out and **drops the readable CSRF cookie itself**. Nobody should need to clear cookies in the browser.

On first load, `fetchMe` only calls `/users/me` if that cookie exists. After a failed login check (401), the cookie is gone, so later visits to `/login` stay quiet. If user-service is **down**, you may still see a console error once (the API is unreachable). Starting the service is the fix, not clearing cookies.

The name in the header is from Redux (`fetchMe`). Logging out hits the API and also drops that CSRF hint.

## If something looks wrong

| What you see | Likely cause |
|---|---|
| Empty product list | No products yet, or product-service is down |
| Stock says “not available” | inventory-service was not running when the product was created |
| Sent to `/login` on cart/orders | Not logged in, or cookies blocked |
| CORS error in the browser console | `CORS_ORIGIN` missing `http://localhost:5173` |
| `ERR_CONNECTION_REFUSED` on port 3004 | **order-service is not running.** `npx nx serve order-service` |
| Same error on 3000–3003 | That API is down. Start the matching `npx nx serve …` |
| 403 on add-to-cart | CSRF header missing (should be automatic in `http.ts`) |
