<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_submissions', function (Blueprint $table) {
            $table->foreignId('title_category_id')->nullable()->after('document_requirement_id')->constrained('title_categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('document_submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('title_category_id');
        });
    }
};
