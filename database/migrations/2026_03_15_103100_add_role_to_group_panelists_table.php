<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('group_panelists', function (Blueprint $table) {
            $table->enum('role', ['chairman', 'member'])->default('member')->after('panel_slot');
        });

        DB::table('group_panelists')->update([
            'role' => DB::raw("CASE WHEN panel_slot = 1 THEN 'chairman' ELSE 'member' END"),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_panelists', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
