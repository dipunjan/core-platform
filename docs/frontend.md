# Website (frontend)

The shop site lives in **`apps/web`**. It is a React app (Vite + **Bootstrap 5.3**) at **http://localhost:5173**. The storefront is branded **swoop**.

Staff UI is a **second app**, **`apps/admin`**, at **http://localhost:5174**. It is not mixed into the shop routes. Logo and banners are uploaded as files there and stored by product-service. The shop reads them via `GET /api/storefront`. Currency is also set on that record.

It talks to the five APIs. Login is stored in **cookies**, not in `localStorage`. Why, and how Postman/Bearer fits: [security.md](security.md). Going live: [deploy.md](deploy.md).

## Run it

1. Start Mongo, RabbitMQ, and the five API programs (see the main README).
2. `npx nx serve web` (or `cd apps/web && npm run dev`)
3. Staff: `npx nx serve admin` → http://localhost:5174
4. Open http://localhost:5173

Each API `.env` must allow both sites in `CORS_ORIGIN` (`http://localhost:5173` and `http://localhost:5174`).

Admin screens: `/` sales, `/branding` (currency, file picker for logo/hero/tiles), `/people` (phone + address), `/products`, `/categories`, `/inventory`, `/login`.

**Admin UX:** pages show a loader on first fetch; save buttons show a spinner while working; validation uses plain-English field hints (not browser-only tooltips). Required fields use a red **\*** on the label; gray hints sit under the field; red errors appear under the field only after submit (e.g. promo **Add tile**). Branding sample files: `branding-samples/README.md`.

### Shop UX highlights

- **Loaders** on home, shop, cart, orders, checkout, and product detail — no “empty” flash before data arrives.
- **Cart** shows a subtotal; header cart count loads on app start (guest bag included).
- **Add to cart** from the grid shows brief “Added” feedback with a link to the cart.
- **Out of stock** disables add on the product page.
- **Checkout** → **Orders** shows a green “Order placed” message; order lines use product names.
- **Orders** nav link is hidden until you are signed in (avoids a surprise login redirect).
- **Buttons** use `loading` labels (“Signing in…”, “Placing order…”) instead of silent disabled states.

### Admin UX highlights

- **Confirm** before delete (products, categories, people, promo tiles).
- **Success banners** after saves; **field hints** and inline errors on forms.
- **Inventory** errors appear on the row you edited, not only at the top.
- **People:** success after role/address changes; tooltips when you cannot edit your own account; empty group messages.
- **Sales** stats use plain labels (All orders, Active orders, Gross revenue).

Catalog edits belong in **admin**: categories, products, featured flags, inventory, logo, banners, currency.

## Shopper flow (Amazon-shaped)

Amazon.com lets you browse and fill a cart without an account. **Placing the order requires sign-in** (or creating an account). True “checkout as guest” is not what Amazon.com does for a full purchase.

This shop follows that:

1. Guest: home, shop, product, **add to cart**, **view cart**.
2. **Proceed to checkout** → `/login?next=/checkout` (or register). The guest bag is copied onto the signed-in cart API.
3. Checkout: confirm **shipping address**, place order.
4. **Orders** stay behind a login (your purchases).

Amazon’s own **Create account** form is name / email / password (and often a mobile). The **address book** is filled at checkout. We collect phone + address on **register** as well, and show them again at checkout, because a shop cannot ship without a delivery address.

Guest cart lines live in the **browser** (`localStorage`), not in cart-service, until you sign in. Tokens still stay in **HttpOnly cookies**, not `localStorage`.

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

Prices from the API are **minor units** (1299 cents). The shop formats them with `storefront.currency` from admin Branding (`useMoney`).

### Search (AJAX, no button)

There is **no separate search results page** — industry standard is `/shop?q=term` (shareable URL, back button works). Same page handles browse and search.

1. Header `SearchBar` debounces input (**300ms**), then updates the URL.
2. Minimum **2 characters** before querying (reduces noise and DB load).
3. `ShopPage` calls `GET /api/products?q=…&category=…&min=…&max=…&sort=…` — server-side filter/sort, not client-side over the full catalog.
4. In-flight requests are **aborted** when the query changes (RTK + `signal`).
5. Uncached on the API when `q` or price filters are present; full catalog list stays cached.

```bash
curl 'http://localhost:3001/api/products?q=shirt&sort=price-asc'
```

## URLs (routing)

Routing is **not** mixed into `App.tsx`. The list of pages is in **`src/routes/router.tsx`**. React Router reads that list and shows the matching page.

`App.tsx` only:

1. Asks “who am I?” once on load (`useAuth().loadMe()`), and loads storefront (currency, logo).
2. Hands the router to the screen (`RouterProvider`).

**Server data** (products, cart, orders, auth session) uses **TanStack Query** in `src/query/`. **Forms** use **react-hook-form** with **zod** schemas in `src/lib/schemas.ts`. There is **no Redux** on either frontend.

Crashes: **`ErrorBoundary`** in `main.tsx` (tree outside the router). Route render/loader failures: **`errorElement: <RouteError />`** in `routes/router.tsx`, nested *under* `Layout` so the header or sidebar stays. Both live in `src/components/` (`ErrorPanel`, `ErrorBoundary`, `RouteError`). Do not put them in `routes/`.

The header is **`Layout`** (never `Shell`). Two gates sit under it:

- **`ProtectedRoute`** — must be logged in. Otherwise go to `/login`.
- **`GuestRoute`** — must be logged *out*. If you already have a session (header shows your name), `/login` and `/register` send you home. The URL can still say `/login` for a moment; then it redirects. Being logged in and seeing the login form was a missing gate, not a second account.

Admin (`apps/admin`) uses the **same names and folders**. Staff `Layout` is a sidebar and hides that chrome on `/login`. Staff `ProtectedRoute` also requires `role === 'admin'`. See [conventions.md](conventions.md).

| URL | Who can open it | Screen |
|---|---|---|
| `/` | Anyone | Home (hero, categories, featured) |
| `/shop` | Anyone | All products — search, category, price, sort (`?q=` for search results) |
| `/shop/:slug` | Anyone | One category (same filters as `/shop`) |
| `/products/:id` | Anyone | One product, stock, add to cart |
| `/cart` | Anyone | Cart. Checkout asks you to sign in |
| `/checkout` | Logged in | Address + place order |
| `/login` | Guests only | Sign in (`?next=` returns you to checkout) |
| `/register` | Guests only | Create account (phone + shipping address) |
| `/orders` | Logged in | Order history, cancel pending |
| anything else | — | Redirects to `/` |

`:id` is the product’s database id (from the URL).

## Folders (what each one is for)

`apps/admin/src` uses the same tree (`pages`, `hooks`, `features`, `components/layout`, `api`, `routes`, `store`).

```
apps/web/src/
  main.tsx         ErrorBoundary, QueryClientProvider, then App
  App.tsx          load current user + storefront, then start the router
  routes/          which URL shows which page
  pages/           one file per screen (puts hooks + components together)
  hooks/           “do this for me” functions pages call (login, load cart, …)
  query/           TanStack Query hooks (catalog, cart, orders, auth)
  features/        (legacy folder — use query/ instead)
    components/
    ErrorBoundary  React class boundary (main.tsx)
    RouteError     React Router errorElement
    ErrorPanel     shared error screen
    ui/            Card, Button, Field, PageHeader, Section, HeroBanner, …
    layout/        Layout, ProtectedRoute (logged in), GuestRoute (logged out)
    catalog/       ProductCard, category chips
    account/       AddressFields (`register` + zod errors, or controlled for admin people)
    cart/          CartLine
    orders/        OrderCard
  api/             axios client, API URLs, TypeScript types
  lib/             schemas (zod), shop filters, helpers
  store/           (removed — no Redux)
  styles/          Bootstrap 5.3 (index.css imports bootstrap + brand tokens)
```

Cross-folder imports use `@` (meaning `src/`) and a folder’s `index.ts` barrel, for example:

```ts
import { Button, ProductCard } from '@/components';
import { useCart } from '@/hooks';
import { money } from '@/api';
```

**Keep pages lean.** Repeated Bootstrap markup lives in `components/ui/` — not copy-pasted on every screen. Use `form-control`, `form-select`, `btn btn-primary`, `card`, `alert`, and the grid (`row` / `col-*`) from [Bootstrap forms](https://getbootstrap.com/docs/5.3/forms/overview/).

| Component | Use for |
|---|---|
| `Card` | White bordered panels (cart table, product detail, checkout) |
| `PageTitle` / `PageHeader` | Page heading (+ optional eyebrow, subtitle, filters) |
| `Section` | Home blocks with title, description, optional action link |
| `HeroBanner` / `PromoGrid` | Storefront hero and promo tiles |
| `ProductGrid` | Responsive product columns |
| `AuthCard` | Login / register forms |
| `TextLink` | Emerald in-text links |
| `Badge` | Category / featured labels |
| `Button`, `Field`, `Flash`, `EmptyState`, `Spinner`, `PageLoader` | Forms and feedback (`Flash` supports success/error tones; `Button` has `loading`) |

Pages compose these; they should not repeat long `className` strings for the same pattern.

Files inside a folder still import siblings with `./` (a Button file does not go through `@/components`). Layout imports `@/components/ui`, not `@/components`, so it does not loop back on itself.

**Pages do not talk to axios.** They call hooks. Hooks call TanStack Query. Query modules call `api/`.

| Hook | Used on | What it does |
|---|---|---|
| `useAuth` | App, Layout, login/register, checkout | Me, login, register, logout; after login, merge guest cart |
| `useCatalog` / `useProduct` / `useStorefront` | Home, shop, product, Layout | Product list / one product + stock / branding |
| `useCart` | Cart, checkout, product cards | Guest or server cart, qty, checkout |
| `useOrders` | Orders, account | List orders, cancel |
| `useMoney` | prices | Format cents using storefront currency |

Checkout is: save address on the user (`useUpdateMeMutation`), create an order via TanStack Query mutation, then clear the cart.

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
| Sent to `/login` on checkout/orders | Not logged in, or cookies blocked. Cart itself is open to guests |
| Register 400 | Phone or address missing |
| CORS error in the browser console | `CORS_ORIGIN` missing `http://localhost:5173` |
| `ERR_CONNECTION_REFUSED` on port 3004 | **order-service is not running.** `npx nx serve order-service` |
| Same error on 3000–3003 | That API is down. Start the matching `npx nx serve …` |
| A styled “this page hit a snag” screen | Caught by `RouteError` / `ErrorBoundary`. Try again or start the APIs |
