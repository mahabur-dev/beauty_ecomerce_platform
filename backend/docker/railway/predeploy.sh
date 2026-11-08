#!/usr/bin/env sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    echo "==> ERROR: APP_KEY is required before migrations can run." >&2
    exit 1
fi

echo "==> Running production database migrations..."
exec php artisan migrate --force --no-interaction
