<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DocumentRequirement>
 */
class DocumentRequirementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'requirement_type' => fake()->randomElement(['Concept Paper', 'Architecture Diagram', 'Recommendation Letter']),
            'due_date' => fake()->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'stage' => 'Concept',
            'is_mandatory' => fake()->boolean(80),
            'academic_year_id' => AcademicYear::factory(),
            'created_by' => User::factory(),
        ];
    }
}
