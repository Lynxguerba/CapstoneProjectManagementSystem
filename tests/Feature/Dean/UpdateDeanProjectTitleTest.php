<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

it('allows a dean to rename an approved project title', function (): void {
    $context = createDeanProjectTitleContext();

    $response = $this
        ->actingAs($context['dean'], 'web')
        ->withSession(['active_role' => 'dean'])
        ->from(route('dean.projects.details', ['group' => $context['group']->id]))
        ->put(route('dean.projects.details.title.update', ['group' => $context['group']->id]), [
            'title' => 'AI Attendance Tracker Pro',
        ]);

    $response
        ->assertRedirect(route('dean.projects.details', ['group' => $context['group']->id]))
        ->assertSessionHas('success', 'Project title renamed successfully.');

    expect($context['submission']->fresh()?->file_name)->toBe('AI Attendance Tracker Pro');
});

it('rejects an empty dean project title', function (): void {
    $context = createDeanProjectTitleContext();

    $response = $this
        ->actingAs($context['dean'], 'web')
        ->withSession(['active_role' => 'dean'])
        ->from(route('dean.projects.details', ['group' => $context['group']->id]))
        ->put(route('dean.projects.details.title.update', ['group' => $context['group']->id]), [
            'title' => '   ',
        ]);

    $response
        ->assertRedirect(route('dean.projects.details', ['group' => $context['group']->id]))
        ->assertSessionHasErrors(['title']);

    expect($context['submission']->fresh()?->file_name)->toBe('AI Attendance Tracker');
});

/**
 * @return array{dean: User, group: Group, submission: DocumentSubmission}
 */
function createDeanProjectTitleContext(): array
{
    $dean = User::factory()->create([
        'role' => 'dean',
    ]);
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $leader = User::factory()->create([
        'role' => 'student',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'label' => 'AY 2025-2026',
        'start_year' => 2025,
        'end_year' => 2026,
        'is_current' => true,
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

    $requirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
        'created_by' => $instructor->id,
    ]);

    $submission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $requirement->id,
        'title_category_id' => null,
        'file_name' => 'AI Attendance Tracker',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/title.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Approved',
        'adviser_status' => 'Approved',
        'submitted_by' => $leader->id,
    ]);

    $group->update([
        'approved_concept_submission_id' => $submission->id,
    ]);

    return [
        'dean' => $dean,
        'group' => $group->fresh() ?? $group,
        'submission' => $submission,
    ];
}
