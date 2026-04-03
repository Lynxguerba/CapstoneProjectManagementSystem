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
        if (Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            return;
        }

        Schema::table('groups', function (Blueprint $table) {
            $table->foreignId('approved_concept_submission_id')
                ->nullable()
                ->after('name')
                ->constrained('document_submissions')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            return;
        }

        Schema::table('groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_concept_submission_id');
        });
    }
};
