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
        Schema::table('document_submissions', function (Blueprint $table) {
            $table->enum('adviser_status', ['Submitted', 'Approved', 'Revision Required'])->default('Submitted')->after('status');
            $table->foreignId('adviser_reviewed_by')->nullable()->after('adviser_status')->constrained('users')->nullOnDelete();
            $table->timestamp('adviser_reviewed_at')->nullable()->after('adviser_reviewed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_submissions', function (Blueprint $table) {
            $table->dropColumn('adviser_reviewed_at');
            $table->dropConstrainedForeignId('adviser_reviewed_by');
            $table->dropColumn('adviser_status');
        });
    }
};
