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
        if (! Schema::hasTable('adviser_availabilities') || ! Schema::hasColumn('adviser_availabilities', 'is_available')) {
            return;
        }

        Schema::table('adviser_availabilities', function (Blueprint $table): void {
            $table->boolean('is_available')->default(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('adviser_availabilities') || ! Schema::hasColumn('adviser_availabilities', 'is_available')) {
            return;
        }

        Schema::table('adviser_availabilities', function (Blueprint $table): void {
            $table->boolean('is_available')->default(true)->change();
        });
    }
};
