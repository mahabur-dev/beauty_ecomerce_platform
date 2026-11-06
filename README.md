# Beauty Commerce Platform

API-first beauty-commerce platform with a Laravel backend and an independently deployable Next.js customer storefront. The administration application will remain separate.

## Repository layout

```text
backend/      Laravel 13 API
docs/         Architecture, decisions, and API documentation
frontend/     Next.js customer storefront
admin/        Reserved for the administration application
```

## Local requirements

- Docker Desktop with Docker Compose
- Git

The application runtime is containerized with PHP 8.4, Nginx, MySQL 8.4, Redis, and Mailpit. A host PHP installation is not required.

## First-time setup

1. Copy `.env.example` to `.env` and replace the local database password.
2. Copy `backend/.env.example` to `backend/.env` and use the same database name, username, and password.
3. Build and start the services: `docker compose up -d --build`.
4. Generate an application key: `docker compose exec app php artisan key:generate`.
5. Run migrations: `docker compose exec app php artisan migrate`.
6. Seed system roles: `docker compose exec app php artisan db:seed --class=RoleSeeder`.
7. Provision the first administrator interactively: `docker compose exec app php artisan identity:provision-super-admin`.

Administrator accounts cannot register publicly. The initial super administrator is provisioned from the CLI; subsequent staff use expiring invitations. Every administrator must enroll TOTP MFA before an admin session is issued.

If a Windows-created bind mount reports that Laravel cannot write to `storage` or `bootstrap/cache`, run this once:

```powershell
docker compose exec --user root app chown -R app:app storage bootstrap/cache
```

API URL: `http://localhost:8000/api/v1/health`

Mailpit dashboard: `http://localhost:8025`

Frontend setup and commands: [Frontend README](frontend/README.md)

API documentation: [Phase 1 API reference](docs/api/phase-1-api-reference.md)

Submission runbook: [Backend checklist](docs/submission/backend-checklist.md)

## Quality checks

```powershell
docker compose exec app composer quality
```

The quality command runs formatting checks, Larastan static analysis, and the automated test suite.

For a clean MySQL schema/seed verification without touching the persistent development database:

```powershell
docker compose --profile test up -d --wait mysql-test
docker compose run --rm --no-deps -e DB_HOST=mysql-test -e DB_DATABASE=beauty_commerce_test -e DB_USERNAME=beauty_test -e DB_PASSWORD=local-test-only app php artisan migrate --seed --force
docker compose --profile test stop mysql-test
```

The test database stores its data in container `tmpfs`; it does not use the persistent development volume.

Architecture notes: [Phase 3 domain schema](docs/architecture/phase-03-domain-schema.md), [Phase 4 identity and access](docs/architecture/phase-04-identity-access.md), [Phase 5 category/brand management](docs/architecture/phase-05-category-brand-management.md), [Phase 6 product/variant/media](docs/architecture/phase-06-product-variant-media.md), and [Phase 7 public catalog](docs/architecture/phase-07-public-catalog.md).

Frontend architecture: [Phase 1 foundation](docs/architecture/frontend-phase-01-foundation.md).

# beauty_ecomerce_platform
