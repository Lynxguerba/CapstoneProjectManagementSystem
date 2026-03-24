<?php

namespace Database\Factories;

use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DocumentSubmission>
 */
class DocumentSubmissionFactory extends Factory
{
    protected $model = DocumentSubmission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fileName = fake()->randomElement([
            'Concept Papers.pdf',
            'Minutes.pdf',
            'Recommendation Letter.pdf',
            'Acknowledgement Receipt.pdf',
            'Evaluation Sheet.pdf',
        ]);

        return [
            'group_id' => Group::factory(),
            'document_requirement_id' => DocumentRequirement::factory(),
            'title_category_id' => TitleCategory::factory(),
            'file_name' => $fileName,
            'file_path' => 'documents/'.fake()->uuid().'-'.$fileName,
            'mime_type' => 'application/pdf',
            'file_size' => fake()->numberBetween(12000, 650000),
            'status' => fake()->randomElement(['Submitted', 'Approved', 'Revision Required']),
            'submitted_by' => User::factory(),
        ];
    }
}
