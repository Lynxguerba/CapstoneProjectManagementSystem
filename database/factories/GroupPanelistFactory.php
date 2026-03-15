<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupPanelist>
 */
class GroupPanelistFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $group = Group::factory()->create();
        $panelist = User::factory()->create([
            'role' => 'panelist',
        ]);
        $assignedBy = User::factory()->create([
            'role' => 'instructor',
        ]);

        return [
            'group_id' => $group->id,
            'panelist_id' => $panelist->id,
            'panel_slot' => 1,
            'role' => 'chairman',
            'assigned_by' => $assignedBy->id,
        ];
    }
}
