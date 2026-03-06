<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the BSIT program ID (assuming it exists)
        $bsitProgramId = DB::table('programs')->where('code', 'BSIT')->value('id');

        if ($bsitProgramId) {
            // Assign BSIT program to students who don't have a program assigned
            DB::table('users')
                ->whereNull('program_id')
                ->where(function ($query) {
                    $query
                        ->where('role', 'student')
                        ->orWhereExists(function ($roleQuery) {
                            $roleQuery
                                ->select(DB::raw('1'))
                                ->from('role_user')
                                ->join('roles', 'roles.id', '=', 'role_user.role_id')
                                ->whereColumn('role_user.user_id', 'users.id')
                                ->where('roles.slug', 'student');
                        });
                })
                ->update(['program_id' => $bsitProgramId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove program_id from students (set to null)
        DB::table('users')
            ->where('program_id', DB::table('programs')->where('code', 'BSIT')->value('id'))
            ->where(function ($query) {
                $query
                    ->where('role', 'student')
                    ->orWhereExists(function ($roleQuery) {
                        $roleQuery
                            ->select(DB::raw('1'))
                            ->from('role_user')
                            ->join('roles', 'roles.id', '=', 'role_user.role_id')
                            ->whereColumn('role_user.user_id', 'users.id')
                            ->where('roles.slug', 'student');
                    });
            })
            ->update(['program_id' => null]);
    }
};
