# Foundation implementation handoff — 2026-11-07

## Scope and non-goals

This is a **foundation implementation**, not a finished enterprise deployment, completed business dashboard, or verified 50,000-concurrent-user platform. Existing architecture, dependencies and API contracts were preserved as far as possible. No Laravel backend was provided, so live authentication/API compatibility cannot be certified.

## Implemented

- Admin sign-in page, mandatory MFA setup/challenge flow and recovery code acknowledgement.
- Client-rendered session gate for `/dashboard/**`, checked using the Laravel `/admin/me` endpoint. Access is denied unless active, email verified, MFA enabled and possessing an admin role.
- Protected neutral application shell with permission-filtered navigation and logout control.
- Non-functional module entry points: categories, products, brands, staff, audit logs. These are placeholders, not CRUD implementations.
- Permission presentation gates, safe post-login redirect validation, session query handling, Laravel validation-error adaptation and minimal automated session tests.
- No business API or database mutations were added beyond the existing auth endpoints.

## Important security boundary

The route gate is **client-side UI protection**. It does not replace API authorization, server-side vendor isolation, CSRF controls, rate limits, or audit logging. The Laravel API must independently enforce every read and write. Since the provided admin app talks to a separate Laravel origin using Sanctum cookies, a Next.js server-side authorization gate cannot be made reliable without inspecting the actual deployment domain/cookie/session configuration. Admin pages contain no server-rendered private data.

## API contract to verify against backend

| Operation     | Expected path                           | Expected response                                   |
| ------------- | --------------------------------------- | --------------------------------------------------- |
| Login         | POST `/api/v1/admin/auth/login`         | `{ "next": "mfa_setup" \| "mfa_challenge" }`        |
| MFA setup     | GET `/api/v1/admin/auth/mfa/setup`      | `{ "secret": "...", "provisioning_uri": "..." }`    |
| Confirm setup | POST `/api/v1/admin/auth/mfa/confirm`   | `{ "user": AdminUser, "recovery_codes": string[] }` |
| MFA challenge | POST `/api/v1/admin/auth/mfa/challenge` | `{ "user": AdminUser }`                             |
| Current user  | GET `/api/v1/admin/me`                  | `{ "data": AdminUser }`                             |
| Logout        | POST `/api/v1/admin/auth/logout`        | 204 or empty success                                |

Check `is_active`, `email_verified`, `mfa_enabled`, `vendor_id`, and `roles` field names; adapt via a validated API mapper if the backend differs. For MFA setup, ensure the provisioning secret is not logged and recovery codes are one-time display only. Confirm MFA setup actually grants session access or requires a further challenge, per backend behavior.

## Security/operational verification before production

1. Run actual Laravel integration tests for login, pending-MFA denial, setup, challenge, recovery, logout, expired session, disabled user, and revoked role.
2. Verify same-site Sanctum cookies, `SANCTUM_STATEFUL_DOMAINS`, CORS origin, CSRF cookie, `SameSite`, HTTPS and subdomain configurations.
3. Establish explicit server-driven permissions (or synchronized generated permission definitions). Current frontend RBAC is static and for display only.
4. Verify all endpoints are vendor scoped in Laravel, and denial remains enforced on direct API requests.
5. Test session expiry while dashboard is open, logout failure, navigation back/forward, concurrent tabs, and denied MFA access.
6. Add security review, E2E browser tests, dependency scan, accessibility audit, monitoring, incident response, and CI secrets management.
7. Load test the **whole platform**; frontend scaffolding cannot establish 50,000 concurrent-user capacity.

## Commands

```bash
cp .env.example .env.local
npm ci
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
npm run dev
```

The ZIP excludes `node_modules`, `.next`, `*.tsbuildinfo` and `.env.local`; install dependencies locally. Node 22.12+ is required by the project. Build needs `NEXT_PUBLIC_*` values from `.env.local`.

## Feature implementation rules

- Keep UI/domain logic inside `src/features/<domain>`; transport via shared `src/lib/api`.
- Keep server state in TanStack Query; don't duplicate it in globals.
- Paginate data on the server; provide stable filter/sort/query keys and invalidate related queries after writes.
- Use shared typed response contracts and explicit error handling. Never trust role gates on the frontend as authorization.
- Implement categories/products CRUD only after validating Laravel routes, data shapes, upload strategies and vendor ownership.
- Preserve order/payment/inventory invariants and do not add new business logic inside dashboard components.
