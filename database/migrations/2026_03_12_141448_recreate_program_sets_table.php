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
        Schema::dropIfExists('program_sets');

        Schema::create('program_sets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('program', 50);
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_sets');

        Schema::create('program_sets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('program')->nullable();
            $table->string('school_year')->nullable();
            $table->string('set_number')->nullable();
            $table->text('description')->nullable();
            $table->string('instructor_name')->nullable();
            $table->timestamps();
        });
    }
};
