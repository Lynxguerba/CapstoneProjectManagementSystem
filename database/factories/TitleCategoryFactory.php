<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TitleCategory>
 */
class TitleCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $program = fake()->randomElement(['BSIT', 'BSIS']);

        return [
            'program' => $program,
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
        ];
    }
}
