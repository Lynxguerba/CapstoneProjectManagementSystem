<?php

namespace Database\Factories;

use App\Models\AdviserProgramUtility;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdviserProgramUtility>
 */
class AdviserProgramUtilityFactory extends Factory
{
    protected $model = AdviserProgramUtility::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'adviser_id' => User::factory(),
            'program' => $this->faker->randomElement(['BSIT', 'BSIS']),
            'max_groups' => $this->faker->numberBetween(2, 6),
        ];
    }
}
