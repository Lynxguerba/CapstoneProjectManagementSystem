<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('panelist_evaluation_sheet_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->string('defense_type_key', 64);
            $table->foreignId('panelist_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('signed_at')->nullable();
            $table->foreignId('signed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['group_id', 'defense_type_key', 'panelist_user_id'],
                'panel_eval_sheet_signature_group_stage_panelist_unique',
            );
            $table->index(['group_id', 'defense_type_key'], 'panel_eval_sheet_signature_group_stage_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('panelist_evaluation_sheet_signatures');
    }
};
