<?php

use App\Models\AcademicYear;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\ESignature;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\ProgramSet;
use App\Models\User;
use App\Services\RecommendationForTitleDefensePdfGenerator;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

it('generates an outline recommendation letter and stores it in the outline document flow', function (): void {
    Storage::fake('public');

    $data = seedOutlineRecommendationGenerationData();
    $captured = (object) [
        'projectTitle' => null,
        'groupName' => null,
        'submittedByNames' => null,
        'adviserName' => null,
    ];

    $this->app->instance(
        RecommendationForTitleDefensePdfGenerator::class,
        new class($captured) extends RecommendationForTitleDefensePdfGenerator
        {
            public function __construct(private object $captured) {}

            public function generateOutlineDefense(
                string $templatePdfPath,
                string $signatureDataUrl,
                string $projectTitle,
                string $groupName,
                string $submittedByNames,
                string $adviserName,
                CarbonInterface $signedAt,
                ?string $programCode = null,
            ): string {
                $this->captured->projectTitle = $projectTitle;
                $this->captured->groupName = $groupName;
                $this->captured->submittedByNames = $submittedByNames;
                $this->captured->adviserName = $adviserName;

                $temporaryDirectory = storage_path('app/private/tmp/test-outline-recommendation-'.uniqid('', true));
                File::ensureDirectoryExists($temporaryDirectory);

                $pdfPath = $temporaryDirectory.'/recommendation-for-outline-defense.pdf';
                File::put($pdfPath, 'fake-outline-recommendation-pdf');

                return $pdfPath;
            }
        }
    );

    $csrfToken = 'outline-recommendation-token';

    $response = $this
        ->actingAs($data['adviser'], 'web')
        ->withSession([
            'active_role' => 'adviser',
            '_token' => $csrfToken,
        ])
        ->postJson(route('adviser.manuscripts.groups.recommendation-outline-defense', [
            'group' => $data['group']->id,
        ]), [
            '_token' => $csrfToken,
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath('recommendation.file_name', 'Recommendation for Outline Defense.pdf');

    $recommendation = AdviserRecommendationDocument::query()->first();
    $submission = DocumentSubmission::query()
        ->where('document_requirement_id', $data['recommendationRequirement']->id)
        ->latest('id')
        ->first();

    expect($recommendation)->not->toBeNull();
    expect($submission)->not->toBeNull();
    expect($submission?->file_name)->toBe('Recommendation for Outline Defense.pdf');
    expect($submission?->status)->toBe('Submitted');
    expect($submission?->adviser_status)->toBe('Approved');
    expect($captured->projectTitle)->toBe('Smart Queueing and Visitor Analytics');
    expect($captured->groupName)->toBe($data['group']->name);
    expect($captured->submittedByNames)->toContain('Alice');
    expect($captured->submittedByNames)->toContain('Bob');
    expect($captured->adviserName)->toContain('Adviser');

    Storage::disk('public')->assertExists("recommendations/group-{$data['group']->id}/outline/recommendation-for-outline-defense.pdf");
});

/**
 * @return array{
 *     adviser: User,
 *     group: Group,
 *     recommendationRequirement: DocumentRequirement
 * }
 */
function seedOutlineRecommendationGenerationData(): array
{
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $adviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Ariel',
        'last_name' => 'Adviser',
    ]);
    $leader = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Alice',
        'last_name' => 'Leader',
    ]);
    $member = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Bob',
        'last_name' => 'Member',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'label' => 'AY 2025-2026',
    ]);

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT 4A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $group = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $leader->id,
        'name' => 'Group Alpha',
    ]);

    $group->members()->attach($member->id);

    GroupAdviser::query()->create([
        'group_id' => $group->id,
        'adviser_id' => $adviser->id,
        'assigned_by' => $instructor->id,
    ]);

    $conceptRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
    ]);

    $approvedConceptSubmission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $conceptRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Smart Queueing and Visitor Analytics',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/approved-concept.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12048,
        'status' => 'Approved',
        'adviser_status' => 'Approved',
        'submitted_by' => $leader->id,
    ]);

    $group->update([
        'approved_concept_submission_id' => $approvedConceptSubmission->id,
    ]);

    $manuscriptRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Manuscript',
        'stage' => 'Outline',
        'academic_year_id' => $academicYear->id,
    ]);

    DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $manuscriptRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Outline Manuscript',
        'file_path' => 'document-submissions/group-'.$group->id.'/outline/manuscript/outline-manuscript.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 18204,
        'status' => 'Submitted',
        'adviser_status' => 'Approved',
        'submitted_by' => $leader->id,
        'adviser_reviewed_by' => $adviser->id,
        'adviser_reviewed_at' => now(),
    ]);

    $recommendationRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Recommendation for Outline Defense',
        'stage' => 'Outline',
        'academic_year_id' => $academicYear->id,
    ]);

    ESignature::query()->create([
        'user_id' => $adviser->id,
        'signature_data' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZxJ0AAAAASUVORK5CYII=',
        'mime_type' => 'image/png',
    ]);

    return [
        'adviser' => $adviser,
        'group' => $group,
        'recommendationRequirement' => $recommendationRequirement,
    ];
}
