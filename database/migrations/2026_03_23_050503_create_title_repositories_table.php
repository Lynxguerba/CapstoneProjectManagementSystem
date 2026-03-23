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
        Schema::create('title_repositories', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('title_category_id')->constrained('title_categories')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('adviser_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['Approved', 'Archived'])->default('Approved');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['academic_year_id', 'title'], 'title_repositories_ay_title_unique');
            $table->index(['title_category_id', 'academic_year_id', 'adviser_id'], 'title_repositories_lookup_index');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('title_repositories');
    }
};
