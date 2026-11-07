# GlowCare Catalog Workspace — R3 UI Design Handoff

## Scope

**UI/UX only.** This release provides Product, Category and Subcategory management screens built from shared components. No Laravel API requests, database writes, inventory reservations or actual file uploads have been added. Existing Dashboard R2, Sanctum session foundation and other pages are preserved.

## Pages

- `/dashboard/products` — product metrics, search, category/status filters, paginated listing, create/edit/delete demo dialogs, local image preview, SKU and price checks.
- `/dashboard/categories` — category metrics, searchable list, create/edit/delete demo dialogs, publication status and icon picker.
- `/dashboard/subcategories` — subcategory list, parent category selection, filtering, preview CRUD.

## Reusable modules

- `src/features/catalog/demo-store.tsx`: typed fixture data and in-memory state provider above dashboard pages, making navigation between these routes retain demo changes without backend calls.
- `src/features/catalog/components/catalog-ui.tsx`: heading, tabs, notices, statistic cards, panel, toolbar, search, status badges, table scroll wrapper, pagination, dialog, actions and fields.
- `src/features/catalog/components/products-page.tsx`: composed product catalog UI.
- `src/features/catalog/components/category-pages.tsx`: one configurable category/subcategory module, two URLs.
- `src/app/globals.css`: catalog design tokens, responsive design, low-motion handling, restrained micro-transitions.

## Design and navigation

Catalog page tabs use Next.js `Link` and preserve the common authenticated dashboard layout. The sidebar/header remain mounted while navigating; `scroll={false}` is used for the catalog tabs to avoid unnecessary scroll resets. Data in the in-memory context persists during in-app catalog navigation, but **resets after a full browser refresh**. This is intentional for an API-free demo.

Forms and filters perform client-side interactions and error feedback only. Delete actions only remove sample items locally. Category deletion is blocked if a sample subcategory or sample product is linked. Image upload is a client-only preview, with a 5 MB limit.

Prices use **USD sample formatting** to align with the existing dashboard demo, and must be localized before production use. Seeded catalog counts are illustrative, not derived from MySQL.

## Deferred, not implemented

- Laravel API integration; persistence and authentication contract verification
- Real image storage and security scanning
- Server-side validation, RBAC and authorization for mutations
- Product variants, inventory synchronization and checkout integration
- Server-side sorting/filtering/pagination for large catalogs
- Browser automation and screenshot-based cross-device visual acceptance

## Local run

```bash
cd admin
cp .env.example .env.local # only if local env is not already configured
npm ci
npm run dev
```

Open `http://localhost:3001/dashboard/products` after authenticating through the existing Laravel admin session. Catalog pages remain protected by the existing auth/permission foundation. **UI routes are not public standalone demos.**

## Verification

Use `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build`. The production build requires the environment variables described in `.env.example`.
