# Dockerfile
# Resep image untuk menjalankan order-service (Laravel) di dalam container.

FROM php:8.3-cli

# Ekstensi pdo_mysql dibutuhkan Laravel untuk terhubung ke MySQL.
# git & unzip dipakai Composer saat memasang dependency (dist/source).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        unzip \
        git \
    && docker-php-ext-install pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

# Composer dibawa dari image resminya untuk memasang dependency.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

# Salin seluruh source code Laravel ke dalam container.
# .dockerignore menjaga vendor/, node_modules/, dan .env tidak ikut.
COPY . .

# Install dependency Laravel.
RUN composer install \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Port yang digunakan oleh order-service.
EXPOSE 3003

# Jalankan migration terlebih dahulu,
# kemudian nyalakan Laravel development server.
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=3003 --no-reload"]
