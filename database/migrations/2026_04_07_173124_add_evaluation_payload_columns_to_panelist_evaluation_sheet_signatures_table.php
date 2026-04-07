<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('panelist_evaluation_sheet_signatures', function (Blueprint $table) {
            $table->date('defense_date')->nullable()->after('panelist_user_id');
            $table->json('presenters')->nullable()->after('defense_date');
            $table->json('individual_scores')->nullable()->after('presenters');
            $table->json('group_scores')->nullable()->after('individual_scores');
            $table->date('passing_grade_date')->nullable()->after('group_scores');
        });
    }

    public function down(): void
    {
        Schema::table('panelist_evaluation_sheet_signatures', function (Blueprint $table) {
            $table->dropColumn([
                'defense_date',
                'presenters',
                'individual_scores',
                'group_scores',
                'passing_grade_date',
            ]);
        });
    }
};
