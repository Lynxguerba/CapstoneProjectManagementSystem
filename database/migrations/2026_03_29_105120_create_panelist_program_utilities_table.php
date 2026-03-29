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
        Schema::create('panelist_program_utilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('panelist_id')->constrained('users')->cascadeOnDelete();
            $table->string('program', 50);
            $table->unsignedSmallInteger('max_groups')->default(0);
            $table->timestamps();

            $table->unique(['panelist_id', 'program']);
            $table->index('panelist_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('panelist_program_utilities');
    }
};
