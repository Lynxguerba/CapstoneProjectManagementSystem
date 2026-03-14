<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupMember>
 */
class GroupMemberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $group = Group::query()->inRandomOrder()->first() ?? Group::factory()->create();
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        return [
            'group_id' => $group->id,
            'student_id' => $student->id,
            'role' => fake()->randomElement(['Project Manager', 'Programmer', 'Documentarian', 'Data Analyst']),
        ];
    }
}
