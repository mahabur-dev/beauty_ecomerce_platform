# Beauty Commerce Frontend

Customer-facing Next.js application for the Beauty Commerce Platform. The app
uses the App Router, strict TypeScript, Tailwind CSS, TanStack Query, Zod, and
Vitest.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- The Laravel API running at `http://localhost:8000`

## Local setup

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The storefront runs at `http://localhost:3000`. Environment files belong in
this directory because Next.js does not load them from `src/`.
Local development uses documented localhost defaults when these variables are
absent. Production builds require both public URL variables to be configured so
a deployment cannot silently target localhost.

## Commands

| Command                 | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Start the local Turbopack development server          |
| `npm run build`         | Create a portable Webpack production build            |
| `npm run lint`          | Run ESLint with zero-warning enforcement              |
| `npm run typecheck`     | Generate route types and run strict TypeScript checks |
| `npm run test`          | Run the Vitest suite once                             |
| `npm run test:coverage` | Generate unit-test coverage                           |
| `npm run format:check`  | Check formatting without changing files               |
| `npm run quality`       | Run lint, typecheck, tests, and production build      |

## Architecture

```text
src/
  app/          Routes, layouts, providers, and route-level boundaries
  components/   Shared UI primitives, feedback states, and application shell
  config/       Validated environment and application metadata
  features/     Business capabilities such as catalog, auth, and cart
  lib/          Framework-agnostic API, query, and utility infrastructure
  styles/       Global semantic design tokens
  test/         Shared automated-test setup
  types/        Cross-feature transport contracts
```

Rules:

- Server Components remain the default; add `"use client"` only at an actual
  interaction boundary.
- Feature code owns its UI, schemas, hooks, and API adapters. Promote code to
  shared folders only when multiple features genuinely reuse it.
- Network calls cross the typed API client in `src/lib/api`; UI components do
  not call `fetch` directly.
- Use semantic design tokens rather than raw brand colors in feature code.
- Secrets must never use the `NEXT_PUBLIC_` prefix. Public variables are
  embedded at build time.

The Laravel API reference is at
[`../docs/api/phase-1-api-reference.md`](../docs/api/phase-1-api-reference.md).

## Customer authentication

Customer authentication uses Laravel Sanctum's HttpOnly session cookie. The
frontend never stores access tokens in browser storage. Ensure the backend's
`SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, and `CORS_ALLOWED_ORIGINS` values
include the storefront host. See the
[Phase 3 authentication architecture](../docs/architecture/frontend-phase-03-authentication.md)
for the complete flow and local backend settings.
