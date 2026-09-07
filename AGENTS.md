# Agent notes

Follow [docs/conventions.md](docs/conventions.md). Cursor rules in `.cursor/rules/` repeat the same map with less prose.

- Frontends: `Layout`, `ProtectedRoute`, `GuestRoute` — not `Shell` / `StaffRoute`.
- Errors: `components/ErrorBoundary` + router `errorElement` → `RouteError`.
- Backends: `src/app/<feature>/` with controller, service, module, `dto/`, `schemas/`.
