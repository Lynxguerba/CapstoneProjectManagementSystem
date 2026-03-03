<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['role_id', 'user_id']);
        });

        $rolesBySlug = DB::table('roles')->pluck('id', 'slug');
        $now = now();

        $users = DB::table('users')
            ->select('id', 'role')
            ->get();

        foreach ($users as $user) {
            $rawRoles = is_string($user->role) ? explode(',', $user->role) : [];

            if (count($rawRoles) === 0) {
                continue;
            }

            $normalizedRoles = collect($rawRoles)
                ->map(fn (string $role): ?string => $this->normalizeRole($role))
                ->filter()
                ->unique()
                ->values();

            if ($normalizedRoles->isEmpty()) {
                continue;
            }

            $insertRows = $normalizedRoles
                ->map(function (string $slug) use ($rolesBySlug, $user, $now): ?array {
                    $roleId = $rolesBySlug->get($slug);

                    if ($roleId === null) {
                        return null;
                    }

                    return [
                        'role_id' => $roleId,
                        'user_id' => $user->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })
                ->filter()
                ->values();

            if ($insertRows->isNotEmpty()) {
                DB::table('role_user')->insert($insertRows->all());
            }

            $activeRole = $normalizedRoles->first();

            if ($activeRole !== null && $activeRole !== $user->role) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['role' => $activeRole]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_user');
    }

    private function normalizeRole(string $role): ?string
    {
        $availableRoles = [
            'admin',
            'student',
            'adviser',
            'instructor',
            'panelist',
            'dean',
            'program_chairperson',
        ];

        $normalizedRole = Str::of($role)
            ->trim()
            ->lower()
            ->replace('-', '_')
            ->replace(' ', '_')
            ->value();

        $aliases = [
            'advisor' => 'adviser',
            'program_chair' => 'program_chairperson',
            'programchair' => 'program_chairperson',
        ];

        $normalizedRole = $aliases[$normalizedRole] ?? $normalizedRole;

        return in_array($normalizedRole, $availableRoles, true) ? $normalizedRole : null;
    }
};
