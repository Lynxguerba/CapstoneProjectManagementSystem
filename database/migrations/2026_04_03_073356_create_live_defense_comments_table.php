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
        Schema::create('live_defense_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignId('document_submission_id')->constrained('document_submissions')->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('author_role', ['Student', 'Adviser', 'Panelist'])->default('Panelist');
            $table->text('message');
            $table->boolean('is_highlight_comment')->default(false);
            $table->timestamps();

            $table->index(['document_submission_id', 'created_at'], 'live_defense_comments_submission_created_index');
            $table->index(['group_id', 'created_at'], 'live_defense_comments_group_created_index');
            $table->index(['author_id', 'created_at'], 'live_defense_comments_author_created_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_defense_comments');
    }
};
