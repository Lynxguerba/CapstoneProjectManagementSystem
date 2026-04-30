<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_defense_verdicts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->string('stage', 64);
            $table->string('verdict', 120);
            $table->foreignId('approved_document_submission_id')
                ->nullable()
                ->constrained('document_submissions')
                ->nullOnDelete();
            $table->foreignId('panelist_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['group_id', 'stage'],
                'group_defense_verdicts_group_stage_unique',
            );
            $table->index(
                ['stage', 'decided_at'],
                'group_defense_verdicts_stage_decided_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_defense_verdicts');
    }
};
