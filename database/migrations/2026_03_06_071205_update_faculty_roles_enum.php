<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE faculties MODIFY roles ENUM('admin', 'faculty', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson') NOT NULL DEFAULT 'faculty'");
        DB::statement("UPDATE faculties SET roles = 'adviser' WHERE roles = 'faculty'");
        DB::statement("ALTER TABLE faculties MODIFY roles ENUM('admin', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson') NOT NULL DEFAULT 'adviser'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE faculties MODIFY roles ENUM('admin', 'faculty', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson') NOT NULL DEFAULT 'adviser'");
        DB::statement("UPDATE faculties SET roles = 'faculty' WHERE roles IN ('adviser', 'panelist', 'instructor', 'dean', 'program_chairperson')");
        DB::statement("ALTER TABLE faculties MODIFY roles ENUM('admin', 'faculty') NOT NULL DEFAULT 'faculty'");
    }
};
