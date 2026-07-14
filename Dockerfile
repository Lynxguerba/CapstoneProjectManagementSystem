FROM php:8.4-cli

WORKDIR /var/www

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js 20 + npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy artisan and core config files first (needed for composer post-install scripts)
COPY artisan composer.json composer.lock ./
COPY config ./config/
COPY app ./app/
COPY routes ./routes/
COPY bootstrap ./bootstrap/
COPY database ./database/

# Install PHP dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Increase PHP upload limits
COPY php.uploads.ini /usr/local/etc/php/conf.d/php.uploads.ini

# Copy package.json files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build frontend assets
RUN npm run build

# Expose port
EXPOSE 8000

# Start Laravel
CMD php artisan serve --host=0.0.0.0 --port=8000
