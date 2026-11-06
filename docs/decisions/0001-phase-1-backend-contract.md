# ADR 0001: Phase 1 Backend Contract

- Status: Accepted
- Date: 2026-11-06
- Decision owners: Project owner and backend implementation team

## Context

Phase 1 delivers the backend for a beauty-commerce platform. The launch topology is one first-party vendor, while ownership boundaries must support a later multi-vendor evolution. Storefront and admin frontends will be separate applications in the same repository, but they are intentionally deferred until their design system is supplied.

## Decisions

### Repository and runtime

- Use a monorepo with future top-level `backend`, `storefront`, and `admin` applications plus shared `docs`.
- Implement only the Laravel backend now.
- Target Laravel 13, PHP 8.3 or newer, MySQL 8.4, and a versioned `/api/v1` contract.
- Prefer a reproducible Docker Compose development environment.

### Vendor and brand boundaries

- Seed one platform vendor for launch.
- Resolve product vendor ownership on the server. Never accept `vendor_id` as an ordinary product mutation field.
- Keep brands global and managed by authorized admins. Vendors select from the shared brand catalog.
- Support full admin brand CRUD with defensive soft deletion or deactivation when a brand is referenced.
- A future private-label brand owner requires a separate ADR and migration; no speculative `owner_vendor_id` is added now.

### Authentication and administration

- Public registration creates customers only. Public payloads cannot select roles, vendor scope, or elevated flags.
- Support customer registration, login, logout, email verification, forgot password, and password reset.
- Provision the initial super admin through a secure interactive command without a source-controlled password.
- Use expiring, revocable, single-use invitations as the preferred staff onboarding flow.
- Permit controlled promotion of an existing verified customer only by a super admin, with recent reauthentication, audit logging, session rotation/revocation, vendor-scope validation, and protection for the last active super admin.
- Require authenticator-app TOTP MFA for every account with an administrative role. Include enrollment confirmation, login challenge, single-use recovery codes, secure reset, rate limiting, and automated tests.
- Customers do not require MFA in Phase 1.

### Catalog

- Use one two-level `categories` hierarchy while exposing separate category and subcategory CRUD APIs.
- Soft-delete categories, subcategories, products, and brands as applicable. Reserve their slugs after deletion.
- Reject deletion of linked category records with HTTP 409 and never cascade-delete products.
- Implement complete product-variant CRUD, variant attributes, duplicate-combination protection, and variant-specific media.
- Every product has exactly one default variant. Every published product has exactly one primary product image.
- Enforce default-variant and primary-image transitions with database transactions, row locks, validation, and concurrency tests.
- Map API-facing `new_price` and `old_price` to the default variant's `price` and `compare_at_price`.

### Public catalog pagination

- `/api/v1/catalog/grouped` returns 10 subcategory groups per page by default.
- Clamp groups to a maximum of 20 per page.
- Return at most 10 products inside each group.
- Public catalog endpoints expose active, non-deleted, publishable records only.

### Cloudinary media

- Use Cloudinary as the production storage provider for images and PDF assets.
- Access Cloudinary only through a domain-facing media gateway so catalog actions are not coupled to an SDK.
- Keep credentials in environment variables and never expose API secrets to either frontend.
- Use randomized server-generated public IDs, isolated environment folders, authenticated server-side uploads, MIME/content checks, size limits, and explicit overwrite behavior.
- Store Cloudinary identifiers and delivery metadata required for deletion and signed delivery; do not trust client-supplied paths or URLs.
- Product images are public delivery assets after validation. Restricted PDFs use authenticated delivery and short-lived signed URLs.
- Upload before database finalization, compensate failed transactions by deleting the uploaded asset, and delete replaced assets only after database commit.
- Ordinary automated tests use a fake media gateway. Live Cloudinary tests are opt-in and never use production credentials.
- PDF upload capability is accepted, but the owning resource and API endpoint remain deferred until the concrete PDF business use case is specified.

## Engineering constraints

- Use thin controllers, Form Requests, Policies, focused Actions, optimized Query objects, API Resources, and explicit domain interfaces.
- Follow SOLID where it improves change isolation; do not introduce a generic repository layer over Eloquent.
- Enforce database integrity and authorization independently of frontend behavior.
- Record every material deviation in a new ADR.

## Consequences

- The system remains simple for a single launch vendor without losing product ownership boundaries.
- Global brands can be reused by future vendors without duplication.
- Cloudinary can be replaced behind the media gateway without rewriting catalog actions.
- Admin onboarding and MFA add implementation and test effort but materially reduce account-takeover risk.
- Framework initialization is blocked until a compatible PHP runtime is active.
