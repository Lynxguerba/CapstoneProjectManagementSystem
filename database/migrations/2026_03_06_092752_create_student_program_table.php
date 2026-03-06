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
        Schema::create('student_program', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->enum('program', ['BSIT', 'BSIS'])->default('BSIT');
            $table->timestamps();
        });

        $now = now();

        $programByUserId = collect();
        if (Schema::hasTable('programs') && Schema::hasColumn('users', 'program_id')) {
            $programByUserId = DB::table('users')
                ->leftJoin('programs', 'programs.id', '=', 'users.program_id')
                ->select('users.id', DB::raw("COALESCE(programs.code, 'BSIT') as program"))
                ->pluck('program', 'users.id');
        }

        $legacyStudents = collect();
        if (Schema::hasTable('students')) {
            $legacyStudents = DB::table('students')
                ->whereNotNull('email')
                ->whereNotNull('program')
                ->select('email', 'program')
                ->get()
                ->keyBy(fn (object $student): string => strtolower((string) $student->email));
        }

        $studentRoleId = Schema::hasTable('roles')
            ? DB::table('roles')->where('slug', 'student')->value('id')
            : null;

        $studentUsers = DB::table('users')
            ->select('id', 'email', 'role')
            ->where(function ($query) use ($studentRoleId): void {
                $query->where('role', 'student');

                if (is_int($studentRoleId)) {
                    $query->orWhereExists(function ($roleQuery) use ($studentRoleId): void {
                        $roleQuery
                            ->select(DB::raw('1'))
                            ->from('role_user')
                            ->whereColumn('role_user.user_id', 'users.id')
                            ->where('role_user.role_id', '=', $studentRoleId);
                    });
                }
            })
            ->get();

        $rows = $studentUsers->map(function (object $user) use ($legacyStudents, $programByUserId, $now): array {
            $emailKey = strtolower((string) ($user->email ?? ''));
            $legacyProgram = $legacyStudents->get($emailKey)?->program;
            $program = is_string($legacyProgram) ? strtoupper($legacyProgram) : null;

            if (! in_array($program, ['BSIT', 'BSIS'], true)) {
                $program = $programByUserId->get($user->id);
            }

            if (! in_array($program, ['BSIT', 'BSIS'], true)) {
                $program = 'BSIT';
            }

            return [
                'student_id' => $user->id,
                'program' => $program,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        if (count($rows) > 0) {
            DB::table('student_program')->insert($rows);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_program');
    }
};
