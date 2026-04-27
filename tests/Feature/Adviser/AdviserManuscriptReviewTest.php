<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

beforeEach(function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

it('lists only assigned outline manuscript submissions on the adviser manuscripts page', function (): void {
    $context = createAdviserManuscriptReviewContext();
    $otherContext = createAdviserManuscriptReviewContext('Beta Group');

    $response = $this
        ->actingAs($context['adviser'], 'web')
        ->withSession(['active_role' => 'adviser'])
        ->get(route('adviser.manuscripts'));

    $response->assertSuccessful();

    $pageProps = data_get($response->viewData('page'), 'props', []);
    $groups = collect(data_get($pageProps, 'groups', []));

    expect($groups)->toHaveCount(1);
    expect($groups->pluck('group_name')->all())->toContain($context['group']->name);
    expect($groups->pluck('group_name')->all())->not->toContain($otherContext['group']->name);
    expect(data_get($groups->first(), 'manuscripts.0.title'))->toBe('Outline Manuscript');
    expect(data_get($groups->first(), 'manuscripts.0.adviser_status'))->toBe('Submitted');
});

it('updates adviser manuscript review status', function (string $status, string $flashMessage): void {
    $context = createAdviserManuscriptReviewContext();

    $response = $this
        ->actingAs($context['adviser'], 'web')
        ->withSession(['active_role' => 'adviser'])
        ->from(route('adviser.manuscripts'))
        ->patch(route('adviser.manuscripts.submissions.status', $context['submission']), [
            'adviser_status' => $status,
        ]);

    $response
        ->assertRedirect(route('adviser.manuscripts'))
        ->assertSessionHas('success', $flashMessage);

    $submission = $context['submission']->fresh();

    expect($submission?->adviser_status)->toBe($status);
    expect($submission?->adviser_reviewed_by)->toBe($context['adviser']->id);
    expect($submission?->adviser_reviewed_at)->not->toBeNull();
})->with([
    'approved' => ['Approved', 'Manuscript approved as adviser.'],
    'revision required' => ['Revision Required', 'Manuscript marked for revision as adviser.'],
]);

/**
 * @return array{
 *     adviser: User,
 *     group: Group,
 *     submission: DocumentSubmission
 * }
 */
function createAdviserManuscriptReviewContext(string $groupName = 'Alpha Group'): array
{
    $adviser = User::factory()->create([
        'role' => 'adviser',
    ]);

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
        'name' => $groupName,
    ]);

    GroupAdviser::query()->create([
        'group_id' => $group->id,
        'adviser_id' => $adviser->id,
        'assigned_by' => $instructor->id,
    ]);

    $requirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Manuscript',
        'stage' => 'Outline',
        'academic_year_id' => $academicYear->id,
    ]);

    $submission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $requirement->id,
        'title_category_id' => null,
        'file_name' => 'Outline Manuscript',
        'file_path' => 'document-submissions/group-'.$group->id.'/outline/manuscript/outline-manuscript.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 2048,
        'status' => 'Submitted',
        'adviser_status' => 'Submitted',
        'submitted_by' => $student->id,
    ]);

    return [
        'adviser' => $adviser,
        'group' => $group,
        'submission' => $submission,
    ];
}
