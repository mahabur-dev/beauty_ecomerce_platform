# GlowCare — Customer Storefront

The primary customer-facing e-commerce storefront for the GlowCare platform. Engineered with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **strict TypeScript** to deliver sub-second page loads, responsive shopping experiences, and accessible beauty discovery.

---

## 1. UX & Architectural Highlights

- **Next.js 16 Partial Prerendering (PPR):** The home page utilizes Next.js 16 cache components with synchronous shells and streaming `<Suspense>` boundaries. Static marketing elements (Hero, Banners, Service Strip) render instantly, while dynamic product and category queries stream asynchronously without blocking page hydration.
- **Enterprise Multi-Select Filtering:** Custom, accessible dropdowns for Subcategories and Brands supporting multi-selection, search filtering (>5 items), active count badges, 1-click clear buttons, and precise icon padding (`right-3.5` inset) preventing border collisions.
- **Bangladeshi Taka (`৳`) Localization:** Full currency localization across product cards, price sliders, min/max filter inputs, variant selectors, and product detail view.
- **Polite Empty & Error States:** Graceful, brand-aligned empty state cards (`EmptyState`) for unavailable categories, empty search results, or offline services, providing clear navigation recovery paths ("Browse All Products", "View All Categories").
- **Product Detail Experience:** High-performance product view featuring an interactive image gallery, thumbnail previews, quantity selectors, variant toggles, customer reviews, and a sticky mobile purchase action bar.
- **Secure Session Handshake:** Integrates with Laravel Sanctum via stateful HttpOnly cookies and automatic CSRF cookie pre-fetching.

---

## 2. Technology Stack

- **Framework:** Next.js 16.4.5 (Turbopack in development, Webpack in build)
- **UI Runtime:** React 19.3.0
- **Language:** TypeScript 5 (Strict Mode, `noImplicitAny`, checked index access)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State & Caching:** TanStack React Query v5 (`^5.106.1`)
- **Icons:** Lucide React (`^1.70.0`)
- **Validation:** Zod v4 (`^4.6.7`)
- **Testing:** Vitest 5 (`^5.1.0`) with React Testing Library and JSDOM

---

## 3. Directory Structure

```text
src/
├── app/
│   ├── (storefront)/              # Route group for storefront layouts
│   │   ├── page.tsx               # PPR Home page with Suspense boundaries
│   │   ├── products/              # Catalog discovery & product detail ([slug])
│   │   ├── categories/[slug]/     # Category scoped catalog & empty states
│   │   └── brands/[slug]/         # Brand scoped catalog & empty states
│   ├── layout.tsx                 # Root layout with metadata and providers
│   └── globals.css                # Semantic design tokens & Tailwind utilities
│
├── components/
│   ├── feedback/                  # EmptyState, ErrorState, LoadingState
│   ├── layout/                    # SiteHeader, PrimaryNavigation, MobileNav
│   └── ui/                        # Reusable primitives (SelectDropdown, MultiSelectDropdown, Modal, Button)
│
├── features/
│   ├── catalog/                   # Catalog components, API adapters, query parsing, contracts
│   ├── home/                      # HomeHero, CategoryCard, ProductCard, OfferBanner, ServiceStrip
│   └── auth/                      # Customer authentication dialogs and schemas
│
└── lib/
    ├── api/                       # Typed HTTP client handling RFC 9457 errors
    └── utils/                     # Formatting utilities, currency helpers, className merging (cn)
```

---

## 4. Local Setup & Configuration

### Requirements
- Node.js `^22.12.0`
- npm `^10.0.0`
- Backend API running on `http://127.0.0.1:8000`

### Installation Steps

1. **Clone and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Configure `.env.local` with the local API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 5. Development & Quality Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Compiles optimized production build (verifies PPR streaming routes) |
| `npm run test` | Executes Vitest unit & component test suite (13 test files, 38+ tests) |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:coverage`| Generates test coverage report |
| `npm run lint` | Runs ESLint with zero-warning threshold enforcement |
| `npm run typecheck` | Validates TypeScript types across all server & client components |
| `npm run format:check`| Checks file formatting via Prettier |
| `npm run quality` | Runs all 4 quality gates: Lint, Typecheck, Test, and Build |

---

## 6. Testing Philosophy

The storefront maintains strict automated testing standards using **Vitest** and **Testing Library**:
- **UI Primitives:** Custom `SelectDropdown` and `MultiSelectDropdown` verify keyboard navigation, focus management, click-outside closures, and aria attributes.
- **Catalog Filtering:** Verifies query parameter serialization, multi-subcategory/brand state syncing, and URL push state.
- **Product Experience:** Verifies gallery thumbnail selection, quantity boundary checks, and review submissions.

```bash
npm run test
```

---

## 7. Production Deployment (Vercel)

The storefront is ready for zero-downtime deployment on **Vercel**:

1. **Connect Repository:** Import the repository in Vercel.
2. **Set Root Directory:** Select `frontend` as the **Root Directory**.
3. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your production backend URL (e.g., `https://backend-production.up.railway.app`).
   - `NEXT_PUBLIC_SITE_URL`: Your production storefront domain (e.g., `https://glowcare.com.bd`).
4. **Deploy:** Vercel will run `npm run build` and provision Edge & Serverless functions with automatic SSL and global CDN caching.
