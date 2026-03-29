<?php

namespace Database\Factories;

use App\Models\PanelistAvailability;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PanelistAvailability>
 */
class PanelistAvailabilityFactory extends Factory
{
    protected $model = PanelistAvailability::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'panelist_id' => User::factory(),
            'is_available' => $this->faker->boolean(80),
        ];
    }
}
