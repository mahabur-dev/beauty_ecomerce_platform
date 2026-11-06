# Beauty Commerce Phase 1 API Reference

Base URL: `http://localhost:8000/api/v1`

All requests and responses use JSON except product-image upload, which uses `multipart/form-data`. Error responses use `application/problem+json` and include `title`, `status`, `detail`, `instance`, and `request_id`. Validation errors additionally include `errors`.

## Browser authentication

Storefront and admin are first-party Sanctum SPAs. Before login or another state-changing request:

1. `GET /sanctum/csrf-cookie` on the API origin.
2. Send subsequent requests with cookies/credentials enabled and the decoded `X-XSRF-TOKEN` header.
3. Use a frontend host listed in `SANCTUM_STATEFUL_DOMAINS`.

Admin password authentication returns `202` with `next=mfa_setup|mfa_challenge`. It does not create an authenticated admin session until the MFA confirm/challenge endpoint succeeds.

## Public catalog

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/categories` | Paginated active roots with active subcategories |
| `GET` | `/categories/{slug}` | Root category by slug |
| `GET` | `/categories/{slug}/subcategories` | Active children of a root |
| `GET` | `/subcategories/{slug}` | Subcategory and parent by slug |
| `GET` | `/brands` | Paginated active global brands |
| `GET` | `/brands/{slug}` | Active brand by slug |
| `GET` | `/catalog/facets` | Bounded brand/attribute/value metadata for filter UI |
| `GET` | `/products` | Paginated, filterable publishable products |
| `GET` | `/products/{slug}` | Publishable product detail |
| `GET` | `/catalog/grouped` | Subcategory groups with bounded product slices |

### Product query parameters

`GET /products` accepts:

- `search`: product name, short description, or brand name.
- `category`: root-category slug.
- `subcategory`: subcategory slug.
- `brand`: brand slug.
- `attribute_value_ids[]`: repeatable IDs; comma-separated IDs are also accepted.
- `min_price`, `max_price`: default-variant price range.
- `sort`: `newest`, `price_asc`, `price_desc`, or `name`.
- `per_page`: default 20, maximum 100.

Public results contain only active, non-deleted products whose category tree is active and which have an active default variant and a primary image. Cost price, internal storage identifiers, audit data, and vendor administration fields are never exposed.

### Grouped catalog

`GET /catalog/grouped` accepts `category`, `page`, and `groups_per_page`. The default is 10 groups per page, the maximum is 20, and every group contains at most 10 products. Empty subcategories are omitted.

## Customer identity

| Method | Endpoint |
| --- | --- |
| `POST` | `/auth/register` |
| `POST` | `/auth/login` |
| `GET` | `/auth/me` |
| `POST` | `/auth/logout` |
| `POST` | `/auth/email/verification-notification` |
| `GET` | `/auth/email/verify/{id}/{hash}` |
| `POST` | `/auth/forgot-password` |
| `POST` | `/auth/reset-password` |

Registration and password fields use `password_confirmation`. Passwords require at least 12 characters with upper/lowercase letters, numbers, and symbols.

## Administrator identity

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/admin/auth/login` | Public, rate-limited |
| `GET` | `/admin/auth/mfa/setup` | Pending admin session |
| `POST` | `/admin/auth/mfa/confirm` | Pending admin session |
| `POST` | `/admin/auth/mfa/challenge` | Pending admin session |
| `GET` | `/admin/me` | Verified admin + MFA |
| `POST` | `/admin/auth/logout` | Verified admin + MFA |
| `POST` | `/admin/auth/mfa/recovery-codes` | Verified admin + password + TOTP |
| `POST` | `/admin/invitations` | Super admin |
| `POST` | `/admin/invitations/accept` | Public invitation token |
| `PUT` | `/admin/users/{user}/administrative-role` | Super admin |
| `DELETE` | `/admin/users/{user}/mfa` | Super admin |

## Category and brand administration

Category and subcategory writes are available to authenticated administrators. Brand reads are available to all administrators; global brand mutations require `super_admin`.

| Resource | Endpoints |
| --- | --- |
| Categories | `GET/POST /admin/categories`, `GET/PATCH/DELETE /admin/categories/{id}`, `POST /admin/categories/{id}/restore` |
| Subcategories | `GET/POST /admin/subcategories`, `GET/PATCH/DELETE /admin/subcategories/{id}`, `POST /admin/subcategories/{id}/restore` |
| Brands | `GET/POST /admin/brands`, `GET/PATCH/DELETE /admin/brands/{id}`, `POST /admin/brands/{id}/restore` |

Admin lists accept `search`, `status`, `trash=without|with|only`, and `per_page` up to 100. Subcategories additionally accept `category_id`.

## Product administration

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET/POST` | `/admin/products` | List/create products |
| `GET/PATCH/DELETE` | `/admin/products/{id}` | Detail/update/soft-delete |
| `POST` | `/admin/products/{id}/restore` | Restore product |
| `POST` | `/admin/products/{id}/variants` | Create variant |
| `PATCH/DELETE` | `/admin/products/{id}/variants/{variant}` | Update/delete variant |
| `POST` | `/admin/products/{id}/images` | Upload Cloudinary image |
| `PATCH/DELETE` | `/admin/products/{id}/images/{image}` | Update metadata/primary or delete |

Product create example:

```json
{
  "category_id": 1,
  "subcategory_id": 2,
  "brand_id": 1,
  "name": "Hydrating Serum",
  "description": "Long product description",
  "status": "draft",
  "variants": [
    {
      "sku": "SERUM-30ML",
      "title": "30 ml",
      "price": "1200.00",
      "compare_at_price": "1500.00",
      "is_default": true,
      "is_active": true,
      "attribute_value_ids": [3]
    }
  ]
}
```

For assignment-compatible clients, create accepts `new_price`, `old_price`, and optional `sku` when `variants` is omitted; these generate the default variant. Product update accepts `new_price` and `old_price` to update that default variant.

Image upload fields: `image`, optional `product_variant_id`, `alt_text`, `sort_order`, and `is_primary`. Allowed formats are JPEG, PNG, WebP, and AVIF; default maximum size is 10 MiB.

## Attributes

All administrators can read attributes. Mutation is super-admin-only.

- `GET/POST /admin/attributes`
- `GET/PATCH/DELETE /admin/attributes/{attribute}`
- `POST /admin/attributes/{attribute}/values`
- `PATCH/DELETE /admin/attributes/{attribute}/values/{value}`

An attribute/value referenced by a variant cannot be deleted.

## Status codes

- `200`: successful read/update/restore.
- `201`: successful creation/upload.
- `202`: staged authentication or generic mail-trigger response.
- `204`: successful logout/delete.
- `401`: authentication required.
- `403`: role, MFA, or vendor-scope denial.
- `404`: missing, hidden, or wrong-resource-type record.
- `409`: linked deletion or prohibited state transition.
- `410`: expired/revoked/used invitation.
- `422`: validation or domain invariant failure.
- `429`: rate limit exceeded.

## Publication checklist

A product can become active only after it has an active root/subcategory pair, exactly one active default variant, and exactly one primary image. The API returns `422` until all publication requirements are satisfied.
