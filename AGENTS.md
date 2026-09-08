# Agent notes

Follow [docs/conventions.md](docs/conventions.md). Cursor rules in `.cursor/rules/` repeat the same map with less prose.

- Frontends: `Layout`, `ProtectedRoute`, `GuestRoute` — not `Shell` / `StaffRoute`.
- Frontends: **TanStack Query** (`src/query/`), **react-hook-form + zod** (`lib/schemas.ts`) — no Redux.
- APIs: **Swagger/OpenAPI** at `/api/docs` via shared `bootstrapNestApp` (`serviceName` in each `main.ts`).
- Payments: `order-service` `app/payments/` — Stripe + Razorpay; admin `/payments` for provider + publishable keys.
- Errors: `components/ErrorBoundary` + router `errorElement` → `RouteError`.
- Backends: `src/app/<feature>/` with controller, service, module, `dto/`, `schemas/`.
