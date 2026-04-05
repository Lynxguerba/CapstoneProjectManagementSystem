<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->string('concept_verdict')->nullable()->after('approved_concept_submission_id');
            $table->foreignId('concept_verdict_by_panelist_id')
                ->nullable()
                ->after('concept_verdict')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('concept_verdict_decided_at')->nullable()->after('concept_verdict_by_panelist_id');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['concept_verdict_by_panelist_id']);
            $table->dropColumn([
                'concept_verdict',
                'concept_verdict_by_panelist_id',
                'concept_verdict_decided_at',
            ]);
        });
    }
};
