<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupAdviser>
 */
class GroupAdviserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $group = Group::query()->inRandomOrder()->first() ?? Group::factory()->create();
        $adviser = User::query()
            ->where('role', 'like', '%adviser%')
            ->inRandomOrder()
            ->first() ?? User::factory()->create([
                'role' => 'adviser',
            ]);
        $assignedBy = User::factory()->create([
            'role' => 'instructor',
        ]);

        return [
            'group_id' => $group->id,
            'adviser_id' => $adviser->id,
            'assigned_by' => $assignedBy->id,
        ];
    }
}
