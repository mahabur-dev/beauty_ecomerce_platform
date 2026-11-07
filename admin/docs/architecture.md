# Admin application architecture

## Boundaries

The admin application is independently installed, built and deployed from `admin/`. It consumes the Laravel `/api/v1/admin` contract and does not import customer-storefront source.

```text
src/
  app/          routes, layouts, providers and route boundaries
  components/   genuinely shared UI and feedback primitives
  config/       validated public runtime configuration
  features/     isolated business capabilities
  lib/api/      credentials, CSRF, parsing and typed API errors
  lib/query/    server-state lifecycle and cache policy
  lib/utils/    framework-agnostic utilities
  test/         shared test environment
  types/        cross-feature transport contracts
```

## Security model

- Laravel Sanctum's HttpOnly session cookie is the session authority.
- Every unsafe browser request initializes the CSRF cookie and forwards the decoded XSRF token.
- Password login only creates a pending administrator session. MFA setup or challenge must finish before privileged endpoints are available.
- Backend policies, roles and vendor scoping remain authoritative. UI permission checks only hide or disable unavailable actions.
- Tokens and credentials are never stored in local or session storage.
- Admin pages are excluded from search indexing and framed embedding.

## Scale model

The frontend uses bounded, server-paginated datasets, cancellable requests and TanStack Query caching. It never assumes that large resources can be loaded into browser memory. The platform target of 50,000 concurrent customer sessions must be verified at the API, database, cache, queue, CDN and load-balancer layers with production-like load tests; the admin frontend alone cannot guarantee that capacity.

## Design handoff

The current styles are intentionally neutral. Design tokens, shared components and the application shell will be introduced from the approved reference without changing the API, authorization or feature boundaries.
