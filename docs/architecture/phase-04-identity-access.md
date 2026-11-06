# Phase 4: Identity and access

## Security boundaries

- Customer registration always assigns only the `customer` role.
- Public administrator registration does not exist.
- The first super administrator is created with the interactive `identity:provision-super-admin` command. Passwords are never command arguments or stored in source control.
- Later administrators are created or promoted through hashed, single-use, expiring invitations.
- A valid administrator password creates only a pending MFA session. The authenticated admin session is issued after TOTP enrollment/challenge or a single-use recovery code.
- Privileged routes require Sanctum session authentication, verified email, an administrative role, and the MFA session marker.
- Super-admin-only changes require a current-password confirmation, revoke target sessions/tokens, and write an audit record.
- MFA secrets use Laravel encrypted casts. Recovery codes and invitation tokens are stored only as hashes.

## Roles

| Role | Scope |
| --- | --- |
| `customer` | Storefront identity |
| `super_admin` | Global administration and staff lifecycle |
| `catalog_manager` | Vendor-scoped catalog operations |

The current single-vendor release still attaches catalog managers to a vendor. This preserves the multi-vendor boundary without changing the global brand model.

## API groups

- `/api/v1/auth/*`: registration, login/logout, profile, email verification, forgot/reset password.
- `/api/v1/admin/auth/*`: staged administrator login, MFA setup/challenge, recovery-code rotation, logout.
- `/api/v1/admin/invitations*`: invitation creation and public token acceptance.
- `/api/v1/admin/users/{user}/*`: controlled role assignment and audited MFA reset.

The browser applications must first request `/sanctum/csrf-cookie`, then send credentialed requests from a host listed in `SANCTUM_STATEFUL_DOMAINS`.

## Operational notes

- Staff invitations default to 48 hours (`ADMIN_INVITATION_TTL_HOURS`).
- Authentication, MFA, public identity, and authenticated identity writes have separate rate-limit buckets.
- Admin MFA reset is deliberately unavailable for self-service. An administrator can rotate their own recovery codes only after current-password and current-TOTP confirmation.
- TOTP is isolated behind `TotpAuthenticator`, keeping the domain actions reusable and the provider replaceable.
