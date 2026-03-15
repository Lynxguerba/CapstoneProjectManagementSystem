<?php

namespace Database\Factories;

use App\Models\DefenseRoom;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DefenseRoom>
 */
class DefenseRoomFactory extends Factory
{
    protected $model = DefenseRoom::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Room '.$this->faker->unique()->numberBetween(201, 299),
            'capacity' => $this->faker->numberBetween(20, 40),
            'is_active' => true,
            'notes' => null,
        ];
    }
}
