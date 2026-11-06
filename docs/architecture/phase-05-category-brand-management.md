# Phase 5: Category and global brand management

## Category model

The API exposes separate root-category and subcategory resources backed by the shared `categories` table. The domain service enforces exactly two levels:

- A category has `parent_id = null`.
- A subcategory must reference an active, non-deleted root category.
- Root-to-child and child-to-root conversion is not accepted by ordinary update endpoints.
- Moving an unreferenced subcategory to another active root is supported; linked subcategories cannot move.
- Slugs are globally unique across both levels and remain reserved after soft deletion.

Both `super_admin` and `catalog_manager` can manage the global category tree. All writes use transactions, row locks and audit records.

## Defensive deletion

- Category, subcategory and brand deletion is soft deletion.
- A root with active children returns `409` on deletion.
- A category/subcategory linked to any product returns `409`.
- A brand linked to any product returns `409`; it can be marked inactive instead.
- A subcategory can be restored only after its active root has been restored.
- Product records are never cascade-deleted by these operations.

## Administrative endpoints

All routes require a verified administrator session with completed MFA.

| Method | Route | Permission |
| --- | --- | --- |
| `GET/POST` | `/api/v1/admin/categories` | administrator |
| `GET/PATCH/DELETE` | `/api/v1/admin/categories/{id}` | administrator |
| `POST` | `/api/v1/admin/categories/{id}/restore` | administrator |
| `GET/POST` | `/api/v1/admin/subcategories` | administrator |
| `GET/PATCH/DELETE` | `/api/v1/admin/subcategories/{id}` | administrator |
| `POST` | `/api/v1/admin/subcategories/{id}/restore` | administrator |
| `GET` | `/api/v1/admin/brands[/{id}]` | administrator |
| `POST/PATCH/DELETE` | `/api/v1/admin/brands[/{id}]` | super admin |
| `POST` | `/api/v1/admin/brands/{id}/restore` | super admin |

List endpoints support `search`, `status`, `trash=without|with|only`, and bounded `per_page` (maximum 100). Subcategory lists additionally support `category_id`.

## Response and audit behavior

- Create returns `201`; successful delete returns `204`.
- Validation and hierarchy violations return problem-details `422` responses.
- Referenced deletion and prohibited moves return problem-details `409` responses.
- Wrong resource type (for example, a child ID on a category route) returns `404`.
- Every create, update, delete and restore writes an `audit_logs` record containing actor, subject, before/after state and request IP.
