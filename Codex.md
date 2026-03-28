Now for if there is new table need to add in Database initialize my codebase, database(apply normalization) and file structure. Provide command for migration or changes in DB, note: i used Docker. Then at the end suggest commi message for the changes.


SEEDING:

    <!-- DROP TABLES -->
    docker compose exec app php artisan migrate:fresh --no-interaction


    <!-- ADD RECORDS -->
    docker compose exec app php artisan db:seed --class=Database\\Seeders\\UserSeeder --no-interaction

    docker compose exec app php artisan db:seed \
    --class=Database\\Seeders\\CsvAccountsAndAcademicYearsSeeder \
    --no-interaction

    docker compose exec app php artisan db:seed --class=Database\\Seeders\\AuditLogsPageSeeder --no-interaction