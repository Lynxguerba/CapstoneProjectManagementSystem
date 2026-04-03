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
        Schema::create('live_defense_comment_highlights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_defense_comment_id')
                ->constrained('live_defense_comments')
                ->cascadeOnDelete();
            $table->string('highlight_id')->unique();
            $table->text('quote_text')->nullable();
            $table->string('comment_emoji', 16)->default('💬');
            $table->json('content')->nullable();
            $table->json('position')->nullable();
            $table->timestamps();

            $table->unique('live_defense_comment_id', 'live_defense_comment_highlights_comment_unique');
            $table->index(['highlight_id', 'created_at'], 'live_defense_comment_highlights_highlight_created_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_defense_comment_highlights');
    }
};
