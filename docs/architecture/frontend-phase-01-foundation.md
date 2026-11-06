# Frontend Phase 1: Enterprise Foundation

## Decision

The customer storefront lives in `frontend/` as a separate Next.js application
inside the existing repository. The Laravel API remains in `backend/`; a future
administration application will remain independently deployable.

## Technical baseline

- Next.js 16 App Router and React 19
- TypeScript strict mode with additional index, optional-property, casing, and
  switch-safety checks
- Tailwind CSS 4 with semantic CSS design tokens
- TanStack Query for interactive server-state coordination
- Zod for runtime boundary validation
- Native `fetch` behind one typed API client
- Vitest, React Testing Library, and V8 coverage
- ESLint and Prettier with Tailwind class ordering

## Module boundaries

Routes and layouts stay in `src/app`. Business capabilities belong in
`src/features`. Framework-neutral infrastructure belongs in `src/lib`, and
validated deployment configuration belongs in `src/config`. A feature may use
shared infrastructure, but it must not import private implementation from a
sibling feature.

Server Components are the default rendering boundary. Client Components are
limited to interaction and browser-state boundaries. TanStack Query is
available through the root provider for those interactive flows; server-rendered
catalog pages can still fetch directly through the same API boundary.

## API and errors

The API client uses the documented `/api/v1` base URL, requests JSON, and sends
first-party credentials for Laravel Sanctum. Non-success responses are mapped
from `application/problem+json` to a typed `ApiError`. CSRF-cookie orchestration
and authentication-specific adapters will be added in the authentication
phase.

## Configuration and security

`.env.example` documents public build-time configuration. The runtime parser
validates URL and name shapes and provides assignment-friendly local defaults.
No secret is exposed through a `NEXT_PUBLIC_` key. Next.js removes the powered-by
header and adds baseline anti-sniffing, anti-framing, referrer, and browser
permission policies. Cloudinary's HTTPS delivery host is the only configured
remote image origin.

## Design readiness

The supplied beauty storefront reference establishes a light blush surface,
magenta brand scale, dark neutral text, rounded geometry, and soft elevation.
These values are expressed as semantic tokens now; complete storefront
components and responsive page composition begin in Phase 2.
