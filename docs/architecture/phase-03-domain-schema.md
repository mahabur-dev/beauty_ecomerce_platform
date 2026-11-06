# Phase 03 Domain Schema Handoff

Date: 2026-11-06 (Asia/Dhaka)

## Delivered modules

- `Domain/Vendor`: launch vendor ownership boundary.
- `Domain/Identity`: users and role membership models.
- `Domain/Catalog`: categories, brands, products, variants, attributes, values, and product images.
- `Domain/Audit`: append-oriented audit log model.
- `Domain/Shared`: reusable backed status enum.

## Physical schema

The canonical Laravel migrations create:

- `vendors`
- `users`, `password_reset_tokens`, `sessions`
- `roles`, `user_roles`
- `categories`
- `brands`
- `products`, `product_categories`
- `product_variants`
- `attributes`, `attribute_values`, `variant_attribute_values`
- `product_images`
- `audit_logs`
- framework cache, queue, and Sanctum token tables

All domain IDs are unsigned BIGINTs. Money uses `DECIMAL(12,2)`. Domain timestamps use microsecond precision. Slugs, SKUs, role codes, attribute codes, and Cloudinary storage paths have explicit unique constraints. Critical ownership and taxonomy links use `RESTRICT`; wholly owned product details and pivots use `CASCADE` as documented.

## Cloudinary image metadata

`product_images.storage_disk` identifies the provider and defaults to `cloudinary`. `storage_path` stores the server-generated Cloudinary public ID; `asset_id`, delivery type, format, byte size, dimensions, ordering, alt text, and primary status are stored separately. Client-supplied URLs are not part of the schema.

PDF ownership is intentionally not modeled until its business owner and access policy are defined.

## Deterministic seed dataset

- 1 active `platform-store` vendor.
- 3 roles: customer, super administrator, and catalog manager.
- 2 root categories and 4 subcategories.
- 2 global brands.
- Shade and size attributes with deterministic values.
- 6 draft products, each with one synchronized primary subcategory pivot and one default active variant.
- 0 users and 0 administrators. The initial super administrator remains a secure provisioning-command responsibility.

Products remain draft because no real Cloudinary assets are uploaded during offline seeding.

## Integrity boundaries

- MySQL checks status and variant monetary ranges.
- Foreign keys reject missing ownership and destructive parent/vendor deletion.
- MySQL cannot use an auto-increment column in the category self-parent `CHECK`; ADR 0002 documents why the rule is enforced by catalog actions instead of privileged triggers.
- Exactly-one-default-variant, primary-image, two-level taxonomy, matching product pivot, and cross-resource ownership are transactional application invariants implemented in later action phases.

## Verification

- Clean migration and seed completed against a new MySQL 8.4 `tmpfs` database.
- Re-running seeders produced stable counts: 1 vendor, 3 roles, 6 categories, 2 brands, 6 products, 6 variants, and 0 users.
- SQLite suite is explicitly isolated in memory.
- MySQL integrity suite runs only against the isolated `mysql-test` profile.
- The persistent development database is never reset by test commands.
- SQLite suite: 8 passed, 64 assertions, and 1 expected MySQL-only skip.
- MySQL integrity suite: 4 passed, 5 assertions.
- Larastan level 8: no errors across application code and `database/`.
- Pint: 71 files passed.
- Composer manifest is valid and the security audit found no known advisories.
