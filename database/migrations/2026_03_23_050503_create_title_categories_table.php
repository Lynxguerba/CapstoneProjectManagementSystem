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
        Schema::create('title_categories', function (Blueprint $table) {
            $table->id();
            $table->enum('program', ['BSIT', 'BSIS']);
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['program', 'name']);
            $table->index('program');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('title_categories');
    }
};
