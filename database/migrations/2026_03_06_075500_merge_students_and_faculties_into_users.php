<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasTable('roles') || ! Schema::hasTable('role_user')) {
            return;
        }

        $rolesBySlug = DB::table('roles')->pluck('id', 'slug');
        $studentRoleId = $rolesBySlug->get('student');
        $now = now();

        $programsByCode = Schema::hasTable('programs')
            ? DB::table('programs')->pluck('id', 'code')
            : collect();

        if (Schema::hasTable('students')) {
            DB::table('students')
                ->orderBy('id')
                ->get()
                ->each(function (object $student) use ($now, $programsByCode, $studentRoleId): void {
                    $email = is_string($student->email ?? null) ? trim($student->email) : '';

                    if ($email === '') {
                        return;
                    }

                    $existingUserId = DB::table('users')->where('email', $email)->value('id');

                    if ($existingUserId === null) {
                        $firstName = is_string($student->first_name ?? null) ? trim($student->first_name) : '';
                        $lastName = is_string($student->last_name ?? null) ? trim($student->last_name) : '';
                        $role = 'student';
                        $status = is_string($student->status ?? null) && $student->status !== '' ? $student->status : 'active';
                        $programCode = is_string($student->program ?? null) ? trim($student->program) : '';
                        $programId = $programsByCode->get($programCode);

                        $existingUserId = DB::table('users')->insertGetId([
                            'name' => trim($firstName.' '.$lastName),
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $email,
                            'role' => $role,
                            'status' => $status,
                            'program_id' => $programId,
                            'password' => (string) ($student->password ?? Hash::make(Str::password(24))),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }

                    if ($studentRoleId !== null) {
                        $exists = DB::table('role_user')
                            ->where('role_id', $studentRoleId)
                            ->where('user_id', $existingUserId)
                            ->exists();

                        if (! $exists) {
                            DB::table('role_user')->insert([
                                'role_id' => $studentRoleId,
                                'user_id' => $existingUserId,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);
                        }
                    }
                });
        }

        if (Schema::hasTable('faculties')) {
            DB::table('faculties')
                ->orderBy('id')
                ->get()
                ->each(function (object $faculty) use ($now, $rolesBySlug): void {
                    $email = is_string($faculty->email ?? null) ? trim($faculty->email) : '';

                    if ($email === '') {
                        return;
                    }

                    $role = is_string($faculty->roles ?? null) ? trim($faculty->roles) : 'adviser';
                    $normalizedRole = in_array($role, ['admin', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson'], true)
                        ? $role
                        : 'adviser';

                    $existingUserId = DB::table('users')->where('email', $email)->value('id');

                    if ($existingUserId === null) {
                        $firstName = is_string($faculty->first_name ?? null) ? trim($faculty->first_name) : '';
                        $lastName = is_string($faculty->last_name ?? null) ? trim($faculty->last_name) : '';
                        $status = is_string($faculty->status ?? null) && $faculty->status !== '' ? $faculty->status : 'active';

                        $existingUserId = DB::table('users')->insertGetId([
                            'name' => trim($firstName.' '.$lastName),
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $email,
                            'role' => $normalizedRole,
                            'status' => $status,
                            'program_id' => null,
                            'password' => Hash::make(Str::password(24)),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }

                    $facultyRoleId = $rolesBySlug->get($normalizedRole);

                    if ($facultyRoleId !== null) {
                        $exists = DB::table('role_user')
                            ->where('role_id', $facultyRoleId)
                            ->where('user_id', $existingUserId)
                            ->exists();

                        if (! $exists) {
                            DB::table('role_user')->insert([
                                'role_id' => $facultyRoleId,
                                'user_id' => $existingUserId,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);
                        }
                    }
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
