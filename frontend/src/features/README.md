# Feature modules

Each business capability gets a folder only when implementation begins. A
feature may contain `api`, `components`, `hooks`, `schemas`, `types`, and tests,
but should export a small public surface through its own `index.ts`.

Planned storefront modules include catalog, customer identity, cart, search,
and account. Features may depend on `lib`, `config`, shared `types`, and shared
UI primitives; they must not reach into another feature's private files.
