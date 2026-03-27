<?php

namespace Database\Factories;

use App\Models\AdviserAvailability;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdviserAvailability>
 */
class AdviserAvailabilityFactory extends Factory
{
    protected $model = AdviserAvailability::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'adviser_id' => User::factory(),
            'is_available' => $this->faker->boolean(80),
        ];
    }
}
