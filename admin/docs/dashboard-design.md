# GlowCare Admin — Dashboard design implementation

## Scope

The approved **first pink GlowCare dashboard concept** was implemented as a responsive dashboard shell and preview. This delivery intentionally does **not** implement Products, Categories, or Subcategories CRUD, and does not alter existing API authentication and permission contracts.

## Design system

- Primary action: `#ed267c`; gentle surface `#fff0f7`; surfaces `#ffffff`; canvas `#f7f7fb`.
- Semantic positive/negative indicators use green/red independently of the pink brand color.
- Navigation and KPI widgets share layout primitives. Charts are dependency-free inline SVG / CSS.
- Planned navigation modules are visibly marked **Soon**, never wired to broken routes.
- Mobile drawer navigation, responsive card columns, accessible headings and labels, keyboard focus states, reduced-motion support.

## Reusable files

- `src/components/app-shell.tsx`: shared authenticated navigation, header, responsive drawer.
- `src/components/ui/icon.tsx`: internal typed SVG icon library.
- `src/components/dashboard/dashboard-widgets.tsx`: reusable panel, cards, charts and table widgets.
- `src/features/dashboard/demo-data.ts`: deliberately isolated illustrative preview records.
- `src/app/dashboard/page.tsx`: dashboard composition only.
- `src/app/globals.css`: scoped dashboard CSS tokens and layout.

## Data integrity and future integration

**All metrics and orders shown in this dashboard are demo fixtures.** They are explicitly marked in the interface as preview data. Do not use these figures for any business decisions. They must be replaced by authorized, validated Laravel reporting endpoints. Never call an arbitrary, undocumented API endpoint or claim dashboard data is live.

Next iteration: define Laravel analytics contract (including period selection, currency, timezone, permission constraints, empty/error/loading states), wire TanStack Query with a typed mapper and tests, then remove fixture imports. Keep server-enforced authorization; permission-based navigation is not an authorization boundary.

## Security and performance

The page does not fetch business data and does not require additional runtime dependencies. Existing Sanctum session flow and protected page layout remain unchanged. The displayed header search is deliberately non-operational until backend search is implemented, and reports this transparently instead of implying search works.

This is a **dashboard visual milestone**, not proof of 50k concurrent user capacity. Full traffic testing requires integrated Laravel, database, caching and deployment infrastructure.
