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

# Copy composer files first (better caching)
COPY composer.json composer.lock ./

# Install PHP dependencies
# RUN composer install --no-interaction --prefer-dist --optimize-autoloader

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