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
        Schema::create('adviser_program_utilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adviser_id')->constrained('users')->cascadeOnDelete();
            $table->string('program', 50);
            $table->unsignedSmallInteger('max_groups')->default(0);
            $table->timestamps();

            $table->unique(['adviser_id', 'program']);
            $table->index('adviser_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adviser_program_utilities');
    }
};
