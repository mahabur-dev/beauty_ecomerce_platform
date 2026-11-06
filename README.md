# Beauty Commerce Platform

API-first beauty-commerce platform. Phase 1 currently implements the Laravel backend. Separate Next.js storefront and admin applications will be added after their design specifications are supplied.

## Repository layout

```text
backend/      Laravel 13 API
docs/         Architecture, decisions, and API documentation
storefront/   Reserved for the customer application
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

If a Windows-created bind mount reports that Laravel cannot write to `storage` or `bootstrap/cache`, run this once:

```powershell
docker compose exec --user root app chown -R app:app storage bootstrap/cache
```

API URL: `http://localhost:8000/api/v1/health`

Mailpit dashboard: `http://localhost:8025`

## Quality checks

```powershell
docker compose exec app composer quality
```

The quality command runs formatting checks, Larastan static analysis, and the automated test suite.

# beauty_ecomerce_platform
