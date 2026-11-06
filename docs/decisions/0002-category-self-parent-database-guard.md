# ADR 0002: Category Self-Parent Enforcement

- Status: Accepted
- Date: 2026-11-06

## Context

The catalog requires `categories.parent_id` to differ from the row's own `id`. MySQL 8.4 rejects a `CHECK` constraint that references an auto-increment column, returning error 3818. A trigger was evaluated, but ordinary application users cannot reliably create triggers when binary logging is enabled without elevated `SUPER` privileges. That requirement is unsuitable for managed production databases and least-privilege deployments.

## Decision

- Keep the self-referencing foreign key with `RESTRICT` deletion behavior.
- Enforce self-parent, cycles, and the two-level maximum in transactional catalog application actions and validation.
- Test these invariants against MySQL in the category implementation phase.
- Do not require elevated database privileges or install environment-dependent triggers.

## Consequences

- Direct SQL writes can bypass the self-parent rule, so application database credentials remain private and all supported writes go through catalog actions.
- The foreign key still prevents references to missing parents and `RESTRICT` prevents destructive parent deletion.
- Hierarchy rules remain explicit, reusable domain-service invariants rather than deployment-specific database behavior.
