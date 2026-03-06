<?php

namespace Database\Seeders;

use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $studentUsers = User::query()
            ->where('role', 'student')
            ->orWhereHas('roles', fn ($query) => $query->where('slug', 'student'))
            ->get(['id']);

        $studentUsers->each(function (User $user): void {
            StudentProgram::query()->updateOrCreate(
                ['student_id' => $user->id],
                ['program' => fake()->randomElement(['BSIT', 'BSIS'])]
            );
        });
    }
}
