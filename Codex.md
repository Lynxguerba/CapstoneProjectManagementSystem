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


and also in the resources/js/pages/Instructor/groups/managePage.tsx, the in the resources/js/components/Instructor/groups/EditGroupMembersModal.tsx add button for deleting group besides the Sava Canges button, then add confirmation for deleting and store
  the file in the resources/js/components/Instructor/students. Then also add feature for adding another member, this feature just in case if insturctor accident to create the group then there is studen who are not include to the group so that instructor
  can add aditional member to the group, place that feature in the row of the table members.