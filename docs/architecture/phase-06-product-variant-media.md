# Phase 6: Product, variant, attribute and media management

## Aggregate boundaries

`Product` is the catalog aggregate root. Product creation persists the product, active category pair, category pivot and initial variants in one transaction. The server resolves vendor ownership; ordinary product payloads never accept `vendor_id`.

- Catalog managers can access only products owned by their assigned vendor.
- Super administrators can access all products and use the first active platform vendor for creation in the current single-vendor release.
- Product create/update supports the assignment-facing `new_price`/`old_price` fields, mapped to the default variant's `price`/`compare_at_price`.
- Rich clients can send the complete `variants` array during creation and use nested variant endpoints afterward.

## Variant invariants

- Every product is created with at least one variant and exactly one default variant.
- Default transitions lock the product and all of its variants before clearing the old default and assigning the new one.
- The current default cannot be unset, deactivated or deleted directly.
- SKU and barcode values are globally unique. A missing SKU is generated server-side.
- A variant can contain at most one value from each attribute.
- Sorted attribute-value combinations must be unique within a product.
- Price values use fixed-precision decimal columns. Compare-at price cannot be lower than price.

## Publication rules

A product can become `active` only when:

1. Its primary subcategory and root category are active and form a valid pair.
2. It has exactly one active default variant.
3. It has exactly one primary product image.

Products are therefore created as drafts, media is uploaded, and publication is an explicit update.

## Cloudinary adapter

The domain depends on `MediaStorage`, not the Cloudinary SDK. `CloudinaryMediaStorage` is the production adapter and tests bind a deterministic fake.

- Server-side signed uploads use the official `cloudinary/cloudinary_php` v3 SDK.
- Credentials exist only in `CLOUDINARY_URL`; clients never receive the API secret.
- Public IDs are server-generated UUIDs inside environment/product folders.
- MIME type and size are validated before upload.
- Cloudinary asset ID, public ID, resource type, delivery type, secure URL, dimensions, format and byte size are persisted.
- If database persistence fails after upload, the adapter immediately performs a compensating delete.
- Normal image deletion commits the database change first, then dispatches a retryable `DeleteMediaAsset` queue job with CDN invalidation.
- Concurrent primary-image changes lock the product image set. Deleting a primary image promotes the next ordered image atomically.

Product PDFs remain intentionally without a public endpoint until their owner, authorization model and delivery policy are defined. The accepted architecture requires restricted PDFs to use authenticated delivery and short-lived signed URLs rather than treating them as public product images.

## Administrative routes

All routes require verified admin authentication and completed MFA.

- `/api/v1/admin/products`: list, create, show, update, soft-delete and restore.
- `/api/v1/admin/products/{product}/variants`: create, update and delete variants.
- `/api/v1/admin/products/{product}/images`: multipart upload, metadata/primary update and delete.
- `/api/v1/admin/attributes`: global attribute reads for administrators; mutations are super-admin-only.
- `/api/v1/admin/attributes/{attribute}/values`: super-admin-only value mutations.

Product lists support bounded pagination, search, status, category, brand and trash filters.

## Operations

Configure:

```dotenv
MEDIA_DRIVER=cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_FOLDER=beauty-commerce/production
PRODUCT_IMAGE_MAX_KILOBYTES=10240
```

Run at least one queue worker so post-commit Cloudinary deletion jobs are processed:

```powershell
docker compose exec app php artisan queue:work --tries=5
```
