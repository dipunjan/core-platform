# Code conventions

Short map so shop, admin, and APIs stay the same shape. Cursor also loads `.cursor/rules/`.

## Two frontends, one pattern

| | Shop `apps/web` | Admin `apps/admin` |
|---|---|---|
| Port | 5173 | 5174 |
| Chrome | `Layout` (header) | `Layout` (sidebar; hidden on `/login`) |
| Logged-in gate | `ProtectedRoute` (any user) | `ProtectedRoute` (`role === 'admin'`) |
| Guest gate | `GuestRoute` (any session → leave login) | `GuestRoute` (admin session → leave login) |
| Auth | TanStack Query + `useAuth` | same |
| Router | `Layout` → public / `GuestRoute` / `ProtectedRoute` | same |

Do **not** name chrome `Shell` or gates `StaffRoute`.

```
src/
  main.tsx          Redux Provider, then App
  App.tsx           loadMe(), RouterProvider
  routes/router.tsx URL → page
  pages/            one screen per file + index.ts barrel
  hooks/            pages call these
  query/            TanStack Query (catalog, cart, orders, auth)
  features/         (empty — legacy folder; logic is in query/)
  components/layout Layout, ProtectedRoute, GuestRoute
  components/       ErrorBoundary, RouteError, ErrorPanel
  components/ui     Button, Field, Flash, Spinner
  api/              http, urls, types
  store/            (removed — no Redux)
```

Imports: `@/pages`, `@/hooks`, `@/components`. Pages do not import axios.

## Five backends, one pattern

```
apps/<name>-service/src/
  main.ts                 bootstrapNestApp(AppModule, { defaultPort })
  app/app.module.ts       Auth, Health, DB, feature modules
  app/database.module.ts
  app/<feature>/          module, controller(s), service, dto/, schemas/
```

Example: products + categories share `products/`. Auth HTTP lives in `users/` beside `UsersController`.

- `@Public()` = no login. `@Roles('admin')` = staff. JWT still required unless public.
- OpenAPI docs at `/api/docs` on every API (via shared `bootstrapNestApp`).
- Import `@core-platform/common`, not files under `packages/common/src`.

## Domain rules (do not drift)

- Prices: integer **minor units** (cents, paise). Display currency is `storefront.currency` (admin Branding).
- Logo/hero/promo images: admin file upload → `POST /api/storefront/assets`, files on product-service.
- Category = taxonomy slug. Featured = product boolean. All = unfiltered list.
- Shop CORS includes `5173` and `5174`.
- Redis is shared memory (throttle, logout denylist, catalog cache), not the database. See [redis.md](redis.md).
