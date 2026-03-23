<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TitleRepository>
 */
class TitleRepositoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(5),
            'title_category_id' => TitleCategory::factory(),
            'academic_year_id' => AcademicYear::factory(),
            'adviser_id' => User::factory()->state(['role' => 'adviser']),
            'status' => fake()->randomElement(['Approved', 'Archived']),
            'created_by' => null,
        ];
    }
}
