# Phase 1 API Contract Summary

Base path: `/api/v1`

This document freezes route families and security boundaries. Request/response schemas will be versioned during their implementation phase.

## Customer authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/email/verification-notification`
- `GET /auth/email/verify/{id}/{hash}`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

## Administrative authentication and identity

- `POST /admin/auth/login`
- `POST /admin/auth/mfa/challenge`
- `POST /admin/auth/logout`
- `GET /admin/me`
- MFA enrollment, confirmation, recovery-code regeneration, and secure reset endpoints will be finalized with the authentication threat model.
- Staff invitation and controlled role-assignment endpoints are super-admin-only.

## Administration

- Separate CRUD route families for categories and subcategories.
- Full global brand CRUD.
- Product CRUD with soft deletion.
- Nested product variant CRUD.
- Product and variant media management.
- Attribute and attribute-value management required by variant workflows.

## Public catalog

- Category, subcategory, and product reads by SEO-safe slug.
- Paginated and filterable product listing.
- Bounded grouped catalog: 10 groups per page by default, 20 maximum, and 10 products per group.

## Error semantics

- `401` for unauthenticated requests.
- `403` for authenticated actors without permission.
- `404` for missing or out-of-scope resources.
- `409` for linked deletion, stale mutation, or prohibited state transitions.
- `422` for invalid request data or business-rule validation failures.

The exact error representation will follow one documented Laravel-consistent JSON envelope across all endpoints.
