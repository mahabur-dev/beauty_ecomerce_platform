# Phase 01 Repository Audit

Date: 2026-11-06 (Asia/Dhaka)

## Outcome

The workspace is empty. There is no existing application or user code to preserve, and no Git repository has been initialized.

## Repository findings

| Area | Finding |
| --- | --- |
| Root contents | Empty |
| Git | Git 2.49.0 is installed; this directory is not a Git repository |
| Laravel | No Laravel application or `composer.json` exists |
| Migrations | None |
| Automated tests | None |
| Frontend applications | None |
| Local PHP | PHP 8.2.12 with the required common extensions, including PDO MySQL, SQLite, fileinfo, GD, EXIF, Sodium and ZIP |
| Composer | Composer 2.8.11 is installed |
| Composer connectivity | Package registry access failed in the sandbox because proxy variables route traffic to an unavailable local endpoint |
| Node.js | Node.js 22.16.0 and npm 10.9.2 are installed |
| Local database client | MariaDB 10.4.32 client from XAMPP; no MySQL/MariaDB process or service was detected |
| Docker | Docker 29.9.2 and Compose 5.6.0 are installed; Docker Desktop/Linux daemon is not running |

## Compatibility decision

The target is Laravel 13 on PHP 8.3 or newer and MySQL 8.4. The currently selected CLI PHP 8.2 cannot run Laravel 13. The XAMPP MariaDB 10.4 installation is not an acceptable substitute for validating MySQL 8.4 constraints and behavior.

Before the foundation phase can be verified, use one of these supported environments:

1. Docker Compose with PHP 8.4 and MySQL 8.4 (preferred for reproducibility), or
2. A local PHP 8.3+ installation and a MySQL 8.4 instance.

No framework files should be generated with the incompatible PHP 8.2 runtime.

## Risks identified

- Dependency installation needs registry network access during project bootstrap.
- MySQL-specific foreign keys, checks, generated behavior and concurrency tests must be executed against MySQL 8.4, not only SQLite or MariaDB.
- Cloudinary integration tests must be isolated from ordinary automated tests. Unit and feature tests will use a fake media gateway; a separately marked integration test will require explicit test credentials.
- The business owner or attachment type for PDF assets is not yet part of the catalog schema. Cloudinary capability will be prepared, but no PDF database field or public endpoint will be invented until that use case is defined.

## Phase exit status

Repository audit is complete. Architecture decisions are captured in `docs/decisions/0001-phase-1-backend-contract.md`. Runtime bootstrap remains the first task of the foundation phase.
