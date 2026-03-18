<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use Illuminate\Database\Seeder;

class DocumentRequirementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $academicYear = AcademicYear::query()->where('is_current', true)->first();

        if ($academicYear === null) {
            $academicYear = AcademicYear::factory()->create([
                'is_current' => true,
            ]);
        }

        DocumentRequirement::factory()
            ->count(3)
            ->state([
                'academic_year_id' => $academicYear->id,
                'stage' => 'Concept',
                'is_mandatory' => true,
            ])
            ->create();
    }
}
