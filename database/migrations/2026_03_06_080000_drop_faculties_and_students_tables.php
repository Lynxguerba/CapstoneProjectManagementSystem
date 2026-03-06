<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('students');
        Schema::dropIfExists('faculties');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->enum('roles', ['admin', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson'])->default('adviser');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->enum('program', ['BSIT', 'BSIS']);
            $table->string('password');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }
};
