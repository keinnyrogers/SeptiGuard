FROM php:8.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libcurl4-openssl-dev \
        libsodium-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
        supervisor \
        unzip \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        curl \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        sodium \
        sockets \
        xml \
        zip \
    && a2enmod rewrite proxy proxy_http proxy_wstunnel \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN mkdir -p bootstrap/cache storage/app/private storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/worker-supervisord.conf /etc/supervisor/worker.conf

RUN sed -i 's/^Listen 80$/Listen 8080/' /etc/apache2/ports.conf

EXPOSE 8080 8081

CMD ["sh", "-c", "chown www-data:www-data storage/app/private && php artisan migrate --force && exec apache2-foreground"]
