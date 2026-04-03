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
        Schema::table('live_defense_comments', function (Blueprint $table) {
            $table->foreignId('referenced_panelist_id')
                ->nullable()
                ->after('author_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_defense_comments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referenced_panelist_id');
        });
    }
};
