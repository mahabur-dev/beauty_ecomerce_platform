# GlowCare — Core REST API

The foundational headless commerce engine for the GlowCare platform. Engineered with **Laravel 13** and **PHP 8.4**, following Domain-Driven Design (DDD) principles to deliver high-throughput, secure, and extensible commerce APIs.

---

## 1. Domain Architecture

The application core resides in `app/Domain/` and is strictly partitioned into distinct bounded contexts:

```text
app/Domain/
├── Catalog/             # Catalog management & public discovery
│   ├── Actions/         # Isolated mutation actions (ManageCategories, ManageBrands, ManageProducts)
│   ├── Models/          # Category (self-parent guard), Brand, Product, ProductVariant, Attribute
│   └── Queries/         # Read queries (PublicProductQuery, AdminCatalogOverview)
│
├── Identity/            # Authentication, RBAC, staff security
│   ├── Actions/         # ProvisionSuperAdmin, IssueStaffInvitation, EnrollMfa, AuthenticateSession
│   ├── Models/          # User, Role, Permission, StaffProfile, AuditLog
│   └── Security/        # TOTP engine, session tracking, cryptographic tokens
│
└── Media/               # Asset ingestion and delivery
    ├── Actions/         # ManageProductImages, CloudinaryMediaStorage
    └── Contracts/       # MediaStorageDriver interface
```

---

## 2. Technology Stack

- **Framework:** Laravel 13 (`^13.17`)
- **PHP Version:** PHP 8.4 (with extensions: `bcmath`, `exif`, `gd`, `intl`, `opcache`, `pcntl`, `pdo_mysql`, `pdo_pgsql`, `redis`, `zip`)
- **Database:** MySQL 8.4 (with PostgreSQL compatibility)
- **Caching & Queues:** Redis / Database driver
- **Media Delivery:** Cloudinary PHP SDK (`^3.0`)
- **Authentication:** Laravel Sanctum (`^4.3`) with stateful cookies + TOTP MFA (`spomky-labs/otphp`)
- **Error Handling:** RFC 9457 Problem Details specification
- **Containerization:** Docker (PHP-FPM 8.4 + Nginx + Supervisord)

---

## 3. Local Development Setup

### Requirements
- PHP 8.4+ and Composer 2
- MySQL 8.0+ or 8.4
- Redis (optional for local; cache falls back to database)

### Installation Steps

1. **Install dependencies:**
   ```bash
   composer install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=beauty_commerce
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

3. **Generate application encryption key:**
   ```bash
   php artisan key:generate
   ```

4. **Execute database migrations:**
   ```bash
   php artisan migrate
   ```

5. **Seed initial roles and catalog data:**
   ```bash
   php artisan db:seed
   ```

6. **Provision the first Super Administrator:**
   Staff accounts cannot register publicly. Provision the initial super admin via the interactive CLI:
   ```bash
   php artisan identity:provision-super-admin
   ```
   Follow the prompts to enter an email, name, and strong password.

7. **Start the development server:**
   ```bash
   php artisan serve --host=127.0.0.1 --port=8000
   ```
   - API Healthcheck: `http://127.0.0.1:8000/api/v1/health`
   - Platform Healthcheck: `http://127.0.0.1:8000/up`

---

## 4. API Endpoints Overview

All public and administrative endpoints are versioned under `/api/v1`:

### Public Catalog (`/api/v1/catalog`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/catalog/products` | Paginated product listing with multi-select subcategories, brands, shades, price filtering, and sorting |
| `GET` | `/api/v1/catalog/products/{slug}` | Detailed product view including images, attributes, variants, and reviews |
| `GET` | `/api/v1/catalog/categories` | Complete category hierarchy and tree structure |
| `GET` | `/api/v1/catalog/categories/{slug}` | Individual category details |
| `GET` | `/api/v1/catalog/brands` | Active brand listings with product counts |
| `GET` | `/api/v1/catalog/brands/{slug}` | Individual brand details |

### Authentication & Identity (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/sanctum/csrf-cookie` | Initializes CSRF token cookie for single-page applications |
| `POST` | `/api/v1/auth/customer/login` | Customer email/password session authentication |
| `POST` | `/api/v1/auth/customer/register` | Customer registration |
| `POST` | `/api/v1/auth/admin/login` | Staff first-step credentials verification (triggers MFA challenge) |
| `POST` | `/api/v1/auth/admin/mfa/challenge` | Verifies 6-digit TOTP code and grants admin session |
| `POST` | `/api/v1/auth/logout` | Revokes authenticated session |

---

## 5. Security & Authentication Architecture

1. **Stateful Session Cookies:** The API utilizes Laravel Sanctum with `HttpOnly`, `SameSite=Lax`, and `Secure` cookies. Access tokens are never exposed to browser `localStorage` or `sessionStorage`.
2. **Reverse Proxy Trust:** Configured with `$middleware->trustProxies(at: '*')` to ensure SSL headers (`X-Forwarded-Proto: https`) forwarded by Railway or Cloudflare are properly trusted.
3. **Feature-gated Staff MFA:** Administrative TOTP enrollment and challenge enforcement are controlled by `ADMIN_MFA_ENABLED`. It defaults to `false`; set it to `true` to require MFA at the middleware boundary.
4. **RFC 9457 Problem Details:** All API exceptions (validation errors, domain exceptions, unauthorized access) respond with standard JSON `application/problem+json` schemas.

---

## 6. Automated Testing & Code Quality

The backend includes a comprehensive automated test suite verifying domain rules, catalog queries, multi-filtering, and security bounds:

```bash
# Run all feature and unit tests (35+ test cases)
php artisan test

# Run static analysis (Larastan Level 6+)
./vendor/bin/phpstan analyse

# Check and fix code style (Laravel Pint)
./vendor/bin/pint --test
```

---

## 7. Production Deployment (Railway)

The backend includes a zero-configuration container setup tailored specifically for **Railway**.

### Container Architecture
- **Base Image:** `php:8.4-fpm-bookworm` + **Nginx** + **Supervisord**.
- **Dynamic Port Ingestion:** Uses `entrypoint.sh` and `envsubst` to dynamically bind Nginx to Railway's assigned `$PORT`.
- **Automated Lifecycle Hooks:** On every container boot, `entrypoint.sh` runs:
  1. Storage symlink creation (`storage:link`)
  2. Database migrations (`php artisan migrate --force`)
  3. Production cache optimizations (`config:cache`, `route:cache`, `view:cache`)
  4. Launches Supervisord to manage PHP-FPM and Nginx.

### How to Deploy on Railway

1. **Create Project & Add MySQL:**
   - On [Railway.app](https://railway.app), create a new project and add a **MySQL** database service.
2. **Connect Repository:**
   - Choose **Deploy from GitHub repo** and select this repository.
3. **Configure Service Settings:**
   - In your backend service **Settings** > **General**:
   - Set **Root Directory** to `/backend` (required for monorepo detection).
4. **Set Environment Variables:**
   - Go to the **Variables** tab and configure your production values using the template provided in [`.env.production.example`](.env.production.example).

> [!TIP]
> **Railway Template Variables vs Real Values:**
> - **Railway Template Variables (`${{MySQL.MYSQLHOST}}`, `${{MySQL.MYSQLPASSWORD}}`):** If your MySQL service in Railway is named `MySQL`, keep these as-is! Railway will automatically resolve and inject the credentials at runtime.
> - **Real Values:** If your database is external (e.g. AWS RDS, PlanetScale) or has a custom service name, replace the `${{...}}` with the actual host, user, port, and password. Both methods work seamlessly.

5. **Deploy & Verify:**
   - Railway will build the Docker container and verify the deployment via `/up`. Once healthy, link your custom domain or use Railway's public URL (`https://*.up.railway.app`).
