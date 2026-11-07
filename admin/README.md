# GlowCare Admin

Independent Next.js administration application for the GlowCare commerce platform. This foundation intentionally contains no final dashboard design; the approved design reference will define tokens, components and the application shell.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- Laravel API running at `http://localhost:8000`

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

The admin application runs at `http://localhost:3001`. The Laravel environment must include `http://localhost:3001` in `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS`.

## Quality commands

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the local admin application on port 3001 |
| `npm run build`        | Create a production Webpack build              |
| `npm run lint`         | Run ESLint with zero warnings                  |
| `npm run typecheck`    | Generate route types and run strict TypeScript |
| `npm run test`         | Run unit and component tests                   |
| `npm run format:check` | Verify formatting                              |
| `npm run quality`      | Run the complete quality gate                  |

## Foundation guarantees

- Strict TypeScript, exact optional properties and checked indexed access
- Validated public environment configuration
- Central API client with credentials, CSRF initialization and RFC 9457-style errors
- Mandatory-MFA transport contracts matching the Laravel backend
- Role/permission presentation policy with backend authorization kept authoritative
- TanStack Query lifecycle defaults suitable for paginated administration data
- Vitest and Testing Library foundation
- Security headers, no-index metadata and independent build/deployment boundary

See [architecture.md](docs/architecture.md) for module ownership and scale constraints.

## Added authentication foundation

- `/login` — administrator login
- `/mfa/setup` and `/mfa/challenge` — MFA enrollment/challenge
- `/dashboard` — session-gated neutral admin shell
- `/dashboard/{categories,products,brands,staff,audit-logs}` — permission-gated **non-functional placeholders** awaiting business feature implementation

See [foundation handoff](docs/foundation-handoff.md) for verified scope, backend contract assumptions, security limitations and release gates. This is not proof of production readiness or 50,000 concurrent-user load capacity.

## Pink dashboard visual milestone (R2)

The approved first GlowCare dashboard reference is now implemented at `/dashboard`.
Navigation, analytics widgets, recent-order table, responsive shell and design tokens are reusable.
The dashboard intentionally displays labeled **sample data**, not production analytics.
Products, Categories, Brands, Staff and Audit Logs retain their existing protected foundation pages.

To run this release locally:

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Configure `.env.local` with the _real_ Laravel API origin and API base URL. Access the admin login at `http://localhost:3001/login`; the authenticated dashboard requires a running backend with the documented Sanctum/MFA contracts. No demo bypass of authentication is included.

Quality gates:

```bash
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
```

See [dashboard-design.md](docs/dashboard-design.md) for component layout, tokens, and API handoff requirements. Production build requires the three `NEXT_PUBLIC_*` URL variables from `.env.example`.
