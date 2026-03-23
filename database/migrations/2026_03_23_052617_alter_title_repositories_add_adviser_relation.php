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
        if (! Schema::hasTable('title_repositories')) {
            return;
        }

        if (! Schema::hasColumn('title_repositories', 'adviser_id')) {
            Schema::table('title_repositories', function (Blueprint $table): void {
                $table->foreignId('adviser_id')->nullable()->constrained('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('title_repositories')) {
            return;
        }

        if (Schema::hasColumn('title_repositories', 'adviser_id')) {
            Schema::table('title_repositories', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('adviser_id');
            });
        }
    }
};
