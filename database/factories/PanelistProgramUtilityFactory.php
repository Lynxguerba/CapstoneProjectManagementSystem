<?php

namespace Database\Factories;

use App\Models\PanelistProgramUtility;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PanelistProgramUtility>
 */
class PanelistProgramUtilityFactory extends Factory
{
    protected $model = PanelistProgramUtility::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'panelist_id' => User::factory(),
            'program' => $this->faker->randomElement(['BSIT', 'BSIS']),
            'max_groups' => $this->faker->numberBetween(2, 6),
        ];
    }
}
