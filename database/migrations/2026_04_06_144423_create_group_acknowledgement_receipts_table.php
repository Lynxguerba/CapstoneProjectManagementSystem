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
        Schema::create('group_acknowledgement_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignId('faculty_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('defense_type_key', 64);
            $table->string('faculty_role', 64);
            $table->unsignedInteger('amount_received');
            $table->date('date_received');
            $table->timestamp('signed_at')->nullable();
            $table->foreignId('signed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['group_id', 'defense_type_key', 'faculty_user_id'], 'group_ack_receipt_group_stage_faculty_unique');
            $table->index(['group_id', 'defense_type_key'], 'group_ack_receipt_group_stage_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_acknowledgement_receipts');
    }
};
