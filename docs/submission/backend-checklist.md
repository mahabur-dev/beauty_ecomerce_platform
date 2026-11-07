# Backend Submission Checklist

## Required environment

- Docker Desktop and Docker Compose are running.
- Root and backend `.env` files exist.
- `APP_KEY`, database credentials, mail settings, `CLOUDINARY_URL`, and frontend URLs are configured.
- No real secret is committed to the repository.

## Build and database

```powershell
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan identity:provision-super-admin
```

The provisioning command is interactive and the first admin must complete TOTP enrollment on first login.

## Runtime workers

```powershell
docker compose exec app php artisan queue:work --tries=5
```

The queue worker processes retryable Cloudinary deletion jobs and queued work.

## Quality gate

```powershell
docker compose exec app composer quality
docker compose --profile test up -d --wait mysql-test
docker compose exec app composer test:integration:mysql
docker compose --profile test stop mysql-test
```

Before packaging, verify that Pint, Larastan, SQLite tests, and isolated MySQL tests are green.

## Manual smoke test

1. Open Mailpit at `http://localhost:8025`.
2. Register and verify a customer.
3. Provision an admin, log in, enroll TOTP, and save recovery codes.
4. Create a root/subcategory, brand, attributes, and values.
5. Create a draft product with variants.
6. Upload a Cloudinary product image and mark it primary.
7. Publish the product and confirm it appears under `/api/v1/products` and `/api/v1/catalog/grouped`.
8. Confirm a draft/deleted product never appears publicly.
9. Confirm a catalog manager cannot read or mutate another vendor's product.

## Deliverables

- Laravel backend source and migrations.
- Docker Compose runtime.
- Seeders and factories with no hardcoded admin credentials.
- Phase architecture/ADR documents.
- [API reference](../api/phase-1-api-reference.md).
- Automated SQLite and MySQL verification suites.

## Explicitly deferred

- Final admin visual system and dashboard screens, pending the supplied visual design. The independent `admin/` application foundation is available.
- Cart, checkout, order, payment, inventory reservation, review, coupon, return, commission, and payout modules.
- Product PDF endpoint until document ownership and authenticated signed-delivery policy are finalized.
