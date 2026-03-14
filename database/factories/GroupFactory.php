<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $programSet = ProgramSet::query()->inRandomOrder()->first();
        if ($programSet === null) {
            $academicYear = AcademicYear::factory()->create();
            $instructor = User::factory()->create([
                'role' => 'instructor',
            ]);
            $program = fake()->randomElement(['BSIT', 'BSIS']);
            $programSet = ProgramSet::query()->create([
                'name' => $program.' '.$academicYear->label,
                'program' => $program,
                'academic_year_id' => $academicYear->id,
                'instructor_id' => $instructor->id,
            ]);
        }

        $leader = User::factory()->create([
            'role' => 'student',
        ]);
        $leaderLastName = trim((string) $leader->last_name);
        if ($leaderLastName === '') {
            $fallbackName = trim((string) $leader->name);
            $leaderLastName = $fallbackName !== '' ? (string) collect(preg_split('/\\s+/', $fallbackName) ?: [])->last() : 'Group';
        }

        return [
            'program_set_id' => $programSet->id,
            'leader_id' => $leader->id,
            'name' => $leaderLastName !== '' ? $leaderLastName : 'Group',
        ];
    }
}
