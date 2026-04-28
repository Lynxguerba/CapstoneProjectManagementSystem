<?php

use App\Models\AcademicYear;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\ProgramSet;
use App\Models\User;

it('lists generated recommendation files per stage on the student documents page', function (): void {
    $data = seedStudentGeneratedRecommendationDocuments();

    $response = $this
        ->actingAs($data['student'], 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.documents'));

    $response->assertSuccessful();

    $pageProps = data_get($response->viewData('page'), 'props', []);
    $generatedFiles = collect(data_get($pageProps, 'generatedFiles', []));

    expect($generatedFiles)->toHaveCount(2);
    expect($generatedFiles->pluck('title')->all())->toContain('Recommendation for Title Defense.pdf');
    expect($generatedFiles->pluck('title')->all())->toContain('Recommendation for Outline Defense.pdf');
    expect($generatedFiles->pluck('stage')->all())->toContain('Concept');
    expect($generatedFiles->pluck('stage')->all())->toContain('Outline');
});

/**
 * @return array{student: User, group: Group}
 */
function seedStudentGeneratedRecommendationDocuments(): array
{
    $student = User::factory()->create([
        'role' => 'student',
    ]);
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $adviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Ariel',
        'last_name' => 'Adviser',
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
        'leader_id' => $student->id,
        'name' => 'Group Alpha',
    ]);

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
        'file_size' => 8192,
        'status' => 'Approved',
        'adviser_status' => 'Approved',
        'submitted_by' => $student->id,
    ]);

    $group->update([
        'approved_concept_submission_id' => $approvedConceptSubmission->id,
    ]);

    $conceptRecommendationRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Recommendation for Title Defense',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
    ]);

    $conceptRecommendationSubmission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $conceptRecommendationRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Recommendation for Title Defense.pdf',
        'file_path' => 'recommendations/group-'.$group->id.'/recommendation-title-defense.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12000,
        'status' => 'Submitted',
        'adviser_status' => 'Approved',
        'submitted_by' => $adviser->id,
        'adviser_reviewed_by' => $adviser->id,
        'adviser_reviewed_at' => now()->subDay(),
    ]);

    AdviserRecommendationDocument::query()->create([
        'group_id' => $group->id,
        'adviser_id' => $adviser->id,
        'document_requirement_id' => $conceptRecommendationRequirement->id,
        'document_submission_id' => $conceptRecommendationSubmission->id,
        'file_name' => 'Recommendation for Title Defense.pdf',
        'file_path' => 'recommendations/group-'.$group->id.'/recommendation-title-defense.pdf',
        'approved_titles' => ['Smart Queueing and Visitor Analytics'],
        'submitted_by_names' => 'Student Leader',
        'signed_at' => now()->subDay(),
    ]);

    $outlineRecommendationRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Recommendation for Outline Defense',
        'stage' => 'Outline',
        'academic_year_id' => $academicYear->id,
    ]);

    $outlineRecommendationSubmission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $outlineRecommendationRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Recommendation for Outline Defense.pdf',
        'file_path' => 'recommendations/group-'.$group->id.'/outline/recommendation-for-outline-defense.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 13200,
        'status' => 'Submitted',
        'adviser_status' => 'Approved',
        'submitted_by' => $adviser->id,
        'adviser_reviewed_by' => $adviser->id,
        'adviser_reviewed_at' => now(),
    ]);

    AdviserRecommendationDocument::query()->create([
        'group_id' => $group->id,
        'adviser_id' => $adviser->id,
        'document_requirement_id' => $outlineRecommendationRequirement->id,
        'document_submission_id' => $outlineRecommendationSubmission->id,
        'file_name' => 'Recommendation for Outline Defense.pdf',
        'file_path' => 'recommendations/group-'.$group->id.'/outline/recommendation-for-outline-defense.pdf',
        'approved_titles' => ['Smart Queueing and Visitor Analytics'],
        'submitted_by_names' => 'Student Leader',
        'signed_at' => now(),
    ]);

    return [
        'student' => $student,
        'group' => $group,
    ];
}
