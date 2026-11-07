# Frontend Phase 2: Shared UI and Application Shell

## Decision

The storefront shell is composed from server-first layout components. Only the
mobile navigation and modal interaction boundary use client-side React state.
The shell owns the promotion strip, brand header, search entry point, desktop
and mobile navigation, customer shortcuts, skip link, main landmark and footer.

## Shared UI

Reusable primitives live in `src/components/ui` and expose a small public
surface through `index.ts`:

- `Button` with variants, sizes, disabled and loading states
- `Input` with labels, hints and accessible validation messages
- compound `Card` sections
- semantic `Badge` variants
- native-dialog-based `Modal` with centered and right-sheet layouts
- `Skeleton` and responsive `Container`

Primitives use semantic design tokens and accept narrowly scoped native element
props. Feature-specific business behavior does not belong in this layer.

## Feedback states

`src/components/feedback` provides consistent loading, empty and error states.
The error state accepts an optional retry action, while loading content exposes
busy semantics and skeletons remain hidden from assistive technology.

## Accessibility and responsiveness

The shell includes keyboard-visible focus states, a skip link, named navigation
landmarks, search landmarks, native modal focus management, reduced-motion
support and mobile-first breakpoints. Inter is hosted locally, so rendering does
not require a browser or build-time font CDN request.

## Scope boundary

The current home content is a reference-matched visual preview using clearly
static category and product data plus locally generated, unbranded imagery.
Backend-driven homepage merchandising, live category/product contracts, filters
and pagination remain Phase 4 responsibilities.

The supplied GlowCare reference establishes the Phase 2 visual source of truth:
a pale blush canvas, hot-pink actions, compact header, image-led hero, floating
trust panel, five-column merchandising grids and soft rose card borders. Shared
tokens and shell components follow that direction so later backend integration
does not require a visual rewrite.
