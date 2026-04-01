SEEDING:

    <!-- DROP TABLES -->
    docker compose exec app php artisan migrate:fresh --no-interaction


    <!-- ADD RECORDS -->
    docker compose exec app php artisan db:seed --class=Database\\Seeders\\UserSeeder --no-interaction

    docker compose exec app php artisan db:seed \
    --class=Database\\Seeders\\CsvAccountsAndAcademicYearsSeeder \
    --no-interaction

    docker compose exec app php artisan db:seed --class=Database\\Seeders\\AuditLogsPageSeeder --no-interaction