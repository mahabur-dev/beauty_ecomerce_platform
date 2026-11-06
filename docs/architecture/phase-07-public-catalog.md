# Phase 7: Public catalog and submission readiness

## Public visibility

Public product queries are centralized in `PublicProductQuery`. A record is visible only when the product, subcategory, and root category are active and non-deleted, the optional brand is active, an active default variant exists, and a primary image exists. Admin resources are never reused publicly, preventing exposure of cost prices and storage metadata.

## Filtering and SEO

- Category, subcategory, brand, and product details use stable slug routes.
- Product lists support search, taxonomy, brand, attribute values, price range, sorting, and bounded pagination.
- Public facet metadata exposes only safe global brand/attribute/value fields.
- Product detail exposes active variants and delivery URLs, but never cost price, Cloudinary public IDs, or internal asset IDs.

## Grouped catalog

`/api/v1/catalog/grouped` paginates active subcategories that contain publishable products.

- Default 10 groups/page; maximum 20.
- Exactly 10 or fewer products per group.
- A SQL window function ranks products independently inside every selected group.
- Only IDs from the bounded window result are hydrated with eager-loaded relations.
- Empty groups are excluded and query count remains constant as group count changes.

## Frontend integration contract

- The storefront can build navigation from `/categories`, `/brands`, and `/catalog/facets`.
- Listing pages use `/products`; home/category discovery can use `/catalog/grouped`.
- Admin UI uses the protected `/admin/*` resources documented in the API reference.
- Cookie authentication requires the Sanctum CSRF handshake and credentials-enabled browser requests.

## Documentation and QA

- `docs/api/phase-1-api-reference.md` is the implemented endpoint reference.
- `docs/submission/backend-checklist.md` is the packaging and smoke-test runbook.
- Automated tests verify hidden drafts, slug lookup, filters, absence of internal fields, bounded grouped pagination, and fixed query count.
