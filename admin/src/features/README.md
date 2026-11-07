# Feature boundaries

Business capabilities live in separate feature folders. A feature owns its API adapters, transport types, validation schemas, queries, mutations and feature-specific components.

Planned modules:

- `auth`: administrator login, mandatory MFA and session lifecycle.
- `dashboard`: operational summaries and alerts.
- `categories`: root-category and subcategory management.
- `products`: product, variant, attribute and media management.
- `brands`: global brand management.
- `staff`: invitations, roles and staff lifecycle.
- `audit-logs`: privileged activity review.

Shared primitives belong in `src/components` only after they are reused across feature boundaries. Backend authorization remains authoritative; frontend permissions control presentation only.
