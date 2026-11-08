# ==============================================================================
# Production Dockerfile for Laravel Backend on Railway
# Combines PHP 8.4 FPM + Nginx + Supervisord in a single container
# ==============================================================================

# --- Stage 1: Build & Composer Dependencies ---
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

# Install production dependencies with caching
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# --- Stage 2: Final Production Image ---
FROM php:8.4-fpm-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=8080

# Install runtime libraries and temporary build dependencies for PHP extensions.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        gettext-base \
        libcurl4 \
        libfreetype6 \
        libicu72 \
        libjpeg62-turbo \
        libonig5 \
        libpng16-16 \
        libpq5 \
        libwebp7 \
        libxml2 \
        libzip4 \
        nginx \
        supervisor \
    && apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        libcurl4-openssl-dev \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libonig-dev \
        libpng-dev \
        libpq-dev \
        libwebp-dev \
        libxml2-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        curl \
        dom \
        exif \
        gd \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        pdo_pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get purge -y --auto-remove \
        $PHPIZE_DEPS \
        libcurl4-openssl-dev \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libonig-dev \
        libpng-dev \
        libpq-dev \
        libwebp-dev \
        libxml2-dev \
        libzip-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/pear

# Copy Composer binary into runtime
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configure PHP & PHP-FPM
COPY docker/railway/php.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/railway/php-fpm.conf /usr/local/etc/php-fpm.d/zz-railway.conf

# Configure Nginx & Supervisord
COPY docker/railway/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/railway/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf

WORKDIR /var/www/html

# Copy vendor dependencies from build stage
COPY --from=vendor /app/vendor /var/www/html/vendor

# Copy application source code
COPY . /var/www/html

# Optimize autoloader with application classes
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative \
    && composer check-platform-reqs --no-dev

# Ensure proper storage directories and permissions
RUN mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy and prepare entrypoint script
COPY docker/railway/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/railway/predeploy.sh /usr/local/bin/predeploy.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/predeploy.sh

EXPOSE ${PORT}

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
