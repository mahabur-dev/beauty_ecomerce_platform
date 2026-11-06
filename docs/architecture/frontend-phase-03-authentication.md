# Frontend Phase 3 — Customer Authentication

## Scope

Phase 3 adds the customer identity experience to the Next.js storefront and
integrates it with the existing Laravel Sanctum API.

Implemented routes:

- `/register`
- `/login`
- `/forgot-password`
- `/reset-password?token=...&email=...`
- `/verify-email`
- `/account` (server protected)

## Architecture

Auth code is owned by `frontend/src/features/auth`:

- `api.ts` is the browser-side API adapter.
- `server.ts` is the server-only session validation boundary.
- `schemas.ts` mirrors the backend validation requirements.
- `hooks.ts` owns the current-user React Query contract.
- `components/` contains reusable auth UI and forms.

Laravel remains the source of truth for authentication and authorization. The
frontend does not store access tokens in local storage. It uses Sanctum's
HttpOnly session cookie, sends credentials on first-party requests, and obtains
an XSRF cookie before every auth mutation.

`/account` validates the session against `/api/v1/auth/me` during server
rendering and redirects unauthenticated users to `/login?next=/account`. Client
checks are used only for presentation and never as the authorization boundary.

## Backend requirements

Local development expects:

```dotenv
APP_URL=http://localhost:8000
STOREFRONT_URL=http://localhost:3000
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

The backend must be running before testing registration, login, verification,
password recovery, or the protected account route.

## Security decisions

- HttpOnly Laravel session cookie; no browser token persistence.
- SameSite cookie behavior and CSRF validation remain enforced by Laravel.
- Open redirects are prevented by accepting only local `next` paths.
- Auth pages are marked `noindex`.
- API validation errors are mapped to accessible field and form messages.
- Forgot-password success remains account-enumeration safe.
- Authentication throttling and password policy remain backend-enforced.

## Verification

The frontend quality gate covers linting, strict TypeScript, unit tests, and a
production build. Auth tests cover password validation, redirect sanitization,
and CSRF-before-credentials request ordering.
