<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AcademicYear>
 */
class AcademicYearFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startYear = fake()->numberBetween(2018, 2030);

        return [
            'start_year' => $startYear,
            'end_year' => $startYear + 1,
            'label' => $startYear.'-'.($startYear + 1),
            'is_current' => false,
        ];
    }
}
