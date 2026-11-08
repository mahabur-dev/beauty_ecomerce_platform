#!/usr/bin/env bash
set -Eeuo pipefail

# Railway may pass a pre-deploy or start override through the image entrypoint.
# Execute explicit commands directly; no arguments means start the web service.
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

if [ -z "${APP_KEY:-}" ]; then
    echo "==> ERROR: APP_KEY is required. Generate one with: php artisan key:generate --show" >&2
    exit 1
fi

if [ "${APP_ENV:-production}" = "production" ] && { [ "${APP_DEBUG:-false}" = "true" ] || [ "${APP_DEBUG:-false}" = "1" ]; }; then
    echo "==> ERROR: APP_DEBUG must be false in production." >&2
    exit 1
fi

if [ "${MEDIA_DRIVER:-cloudinary}" = "cloudinary" ] && [ -z "${CLOUDINARY_URL:-}" ]; then
    echo "==> ERROR: CLOUDINARY_URL is required when MEDIA_DRIVER=cloudinary." >&2
    exit 1
fi

# Default port to 8080 if not provided by Railway
PORT="${PORT:-8080}"
export PORT

echo "==> Configuring Nginx to listen on port: ${PORT}"
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure required storage directories exist
mkdir -p /var/www/html/storage/framework/{sessions,views,cache/data}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Ensure correct permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Create storage link if missing
if [ ! -L /var/www/html/public/storage ]; then
    echo "==> Creating storage symlink..."
    php artisan storage:link --quiet
fi

# Migrations run through predeploy.sh. A failed migration prevents
# the new release from receiving traffic instead of starting on a stale schema.
echo "==> Optimizing Laravel for production..."
php artisan optimize

# Artisan cache files are generated as root during startup; restore the runtime
# user's ownership before PHP-FPM and the queue worker start.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting Supervisord (PHP-FPM + Nginx + queue worker)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
