<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

it('stores a manuscript submission against the active phase 2 manuscript requirement', function (): void {
    Storage::fake('public');

    $context = createStudentManuscriptContext();
    $file = UploadedFile::fake()->create('outline-review-manuscript.pdf', 512, 'application/pdf');

    $response = $this
        ->actingAs($context['student'], 'web')
        ->withSession(['active_role' => 'student'])
        ->from(route('student.manuscripts'))
        ->post(route('student.manuscripts.submissions.store'), [
            'manuscript_file' => $file,
        ]);

    $response
        ->assertRedirect(route('student.manuscripts'))
        ->assertSessionHas('success', 'Manuscript submitted successfully.');

    $outlineRequirementIds = [$context['manuscriptRequirement']->id, $context['projectOutlineRequirement']->id];
    $submission = DocumentSubmission::query()
        ->whereIn('document_requirement_id', $outlineRequirementIds)
        ->latest('id')
        ->first();

    expect($submission)->not->toBeNull();
    expect($submission?->document_requirement_id)->toBe($context['manuscriptRequirement']->id);
    expect($submission?->group_id)->toBe($context['group']->id);
    expect($submission?->file_name)->toBe('Outline Review Manuscript');
    expect($submission?->status)->toBe('Submitted');

    Storage::disk('public')->assertExists((string) $submission?->file_path);
});

it('replaces the existing manuscript so only one active phase 2 upload remains', function (): void {
    Storage::fake('public');

    $context = createStudentManuscriptContext();
    $storedPath = Storage::disk('public')->putFile(
        'document-submissions/group-'.$context['group']->id.'/outline/manuscript',
        UploadedFile::fake()->create('old-outline.pdf', 128, 'application/pdf'),
    );

    $existingSubmission = DocumentSubmission::factory()->create([
        'group_id' => $context['group']->id,
        'document_requirement_id' => $context['projectOutlineRequirement']->id,
        'title_category_id' => null,
        'file_name' => 'Old Outline Manuscript',
        'file_path' => $storedPath,
        'status' => 'Revision Required',
        'submitted_by' => $context['student']->id,
    ]);

    Storage::disk('public')->assertExists($storedPath);

    $replacementFile = UploadedFile::fake()->create('final-outline-manuscript.pdf', 768, 'application/pdf');

    $response = $this
        ->actingAs($context['student'], 'web')
        ->withSession(['active_role' => 'student'])
        ->from(route('student.manuscripts'))
        ->post(route('student.manuscripts.submissions.store'), [
            'manuscript_file' => $replacementFile,
        ]);

    $response
        ->assertRedirect(route('student.manuscripts'))
        ->assertSessionHas('success', 'Manuscript replaced successfully.');

    $outlineRequirementIds = [$context['manuscriptRequirement']->id, $context['projectOutlineRequirement']->id];
    $outlineSubmissions = DocumentSubmission::query()
        ->whereIn('document_requirement_id', $outlineRequirementIds)
        ->orderByDesc('id')
        ->get();

    expect($outlineSubmissions)->toHaveCount(1);

    $latestSubmission = $outlineSubmissions->first();

    expect($latestSubmission?->id)->not->toBe($existingSubmission->id);
    expect($latestSubmission?->document_requirement_id)->toBe($context['manuscriptRequirement']->id);
    expect($latestSubmission?->file_name)->toBe('Final Outline Manuscript');

    Storage::disk('public')->assertMissing($storedPath);
    Storage::disk('public')->assertExists((string) $latestSubmission?->file_path);
});

/**
 * @return array{
 *     student: User,
 *     group: Group,
 *     manuscriptRequirement: DocumentRequirement,
 *     projectOutlineRequirement: DocumentRequirement
 * }
 */
function createStudentManuscriptContext(): array
{
    $student = User::factory()->create([
        'role' => 'student',
    ]);

    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $academicYear = AcademicYear::factory()->create();

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT '.$academicYear->label,
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $group = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $student->id,
        'name' => 'Alpha Group',
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
        'file_name' => 'Approved Concept',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/approved-concept.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 1024,
        'status' => 'Approved',
        'submitted_by' => $student->id,
    ]);

    $group->update([
        'approved_concept_submission_id' => $approvedConceptSubmission->id,
    ]);

    $manuscriptRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Manuscript',
        'stage' => 'Outline',
        'academic_year_id' => $academicYear->id,
    ]);

    $projectOutlineRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Project Outline',
        'stage' => 'Outline',
        'academic_year_id' => $academicYear->id,
    ]);

    return [
        'student' => $student,
        'group' => $group,
        'manuscriptRequirement' => $manuscriptRequirement,
        'projectOutlineRequirement' => $projectOutlineRequirement,
    ];
}
