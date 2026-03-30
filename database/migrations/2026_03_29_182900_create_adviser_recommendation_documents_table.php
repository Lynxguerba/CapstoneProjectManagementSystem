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
        Schema::create('adviser_recommendation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignId('adviser_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('document_requirement_id')->constrained('document_requirements')->cascadeOnDelete();
            $table->foreignId('document_submission_id')->nullable()->constrained('document_submissions')->nullOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->json('approved_titles');
            $table->string('submitted_by_names');
            $table->timestamp('signed_at');
            $table->timestamps();

            $table->index(['group_id', 'document_requirement_id'], 'adviser_reco_group_requirement_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adviser_recommendation_documents');
    }
};
