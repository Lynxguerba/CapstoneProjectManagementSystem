<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @return array{
 *     instructor: User,
 *     chairman: User,
 *     member: User,
 *     group: Group,
 *     submissionOne: DocumentSubmission,
 *     submissionTwo: DocumentSubmission
 * }
 */
function seedLiveDefenseApprovalData(): array
{
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $chairman = User::factory()->create([
        'role' => 'panelist',
    ]);
    $member = User::factory()->create([
        'role' => 'panelist',
    ]);
    $leader = User::factory()->create([
        'role' => 'student',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => 'AY 2025-2026',
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

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $chairman->id,
        'panel_slot' => 1,
        'role' => 'chairman',
        'assigned_by' => $instructor->id,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $member->id,
        'panel_slot' => 2,
        'role' => 'member',
        'assigned_by' => $instructor->id,
    ]);

    $conceptRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
        'created_by' => $instructor->id,
    ]);

    $submissionOne = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $conceptRequirement->id,
        'title_category_id' => null,
        'file_name' => 'AI Attendance Tracker',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/title-one.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Submitted',
        'adviser_status' => 'Submitted',
        'submitted_by' => $leader->id,
    ]);

    $submissionTwo = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $conceptRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Campus Queue Optimizer',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/title-two.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Submitted',
        'adviser_status' => 'Submitted',
        'submitted_by' => $leader->id,
    ]);

    return [
        'instructor' => $instructor,
        'chairman' => $chairman,
        'member' => $member,
        'group' => $group,
        'submissionOne' => $submissionOne,
        'submissionTwo' => $submissionTwo,
    ];
}

it('allows panel chairman to approve one concept title', function (): void {
    $data = seedLiveDefenseApprovalData();
    $csrfToken = 'panelist-chairman-token';

    $this->actingAs($data['chairman'], 'web')
        ->withSession([
            'active_role' => 'panelist',
            '_token' => $csrfToken,
        ])
        ->post(route('panelist.live-defense.title-approvals.store'), [
            '_token' => $csrfToken,
            'document_submission_id' => $data['submissionTwo']->id,
        ])
        ->assertRedirect(route('panelist.live-defense', [
            'group' => $data['group']->id,
        ]));

    $this->assertDatabaseHas('groups', [
        'id' => $data['group']->id,
        'approved_concept_submission_id' => $data['submissionTwo']->id,
    ]);
});

it('blocks panel member from approving concept title', function (): void {
    $data = seedLiveDefenseApprovalData();
    $csrfToken = 'panelist-member-token';

    $this->actingAs($data['member'], 'web')
        ->withSession([
            'active_role' => 'panelist',
            '_token' => $csrfToken,
        ])
        ->post(route('panelist.live-defense.title-approvals.store'), [
            '_token' => $csrfToken,
            'document_submission_id' => $data['submissionOne']->id,
        ])
        ->assertForbidden();

    $this->assertDatabaseHas('groups', [
        'id' => $data['group']->id,
        'approved_concept_submission_id' => null,
    ]);
});

it('allows panel chairman to undo approved concept title', function (): void {
    $data = seedLiveDefenseApprovalData();
    $data['group']->update([
        'approved_concept_submission_id' => $data['submissionOne']->id,
    ]);
    $csrfToken = 'panelist-chairman-undo-token';

    $this->actingAs($data['chairman'], 'web')
        ->withSession([
            'active_role' => 'panelist',
            '_token' => $csrfToken,
        ])
        ->delete(route('panelist.live-defense.title-approvals.destroy'), [
            '_token' => $csrfToken,
            'group_id' => $data['group']->id,
        ])
        ->assertRedirect(route('panelist.live-defense', [
            'group' => $data['group']->id,
        ]));

    $this->assertDatabaseHas('groups', [
        'id' => $data['group']->id,
        'approved_concept_submission_id' => null,
    ]);
});

it('blocks panel member from undoing approved concept title', function (): void {
    $data = seedLiveDefenseApprovalData();
    $data['group']->update([
        'approved_concept_submission_id' => $data['submissionOne']->id,
    ]);
    $csrfToken = 'panelist-member-undo-token';

    $this->actingAs($data['member'], 'web')
        ->withSession([
            'active_role' => 'panelist',
            '_token' => $csrfToken,
        ])
        ->delete(route('panelist.live-defense.title-approvals.destroy'), [
            '_token' => $csrfToken,
            'group_id' => $data['group']->id,
        ])
        ->assertForbidden();

    $this->assertDatabaseHas('groups', [
        'id' => $data['group']->id,
        'approved_concept_submission_id' => $data['submissionOne']->id,
    ]);
});

it('returns panelist approval status props for chairman and member viewers', function (): void {
    $data = seedLiveDefenseApprovalData();
    $data['group']->update([
        'approved_concept_submission_id' => $data['submissionOne']->id,
    ]);

    $chairmanResponse = $this->actingAs($data['chairman'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.live-defense', [
            'group' => $data['group']->id,
        ]));

    $chairmanResponse->assertOk();

    $chairmanProps = data_get($chairmanResponse->viewData('page'), 'props', []);
    $chairmanStatuses = collect(data_get($chairmanProps, 'conceptSubmissions', []))
        ->mapWithKeys(fn (array $submission): array => [(int) data_get($submission, 'id') => (string) data_get($submission, 'panelistApprovalStatus')]);

    expect(data_get($chairmanProps, 'canApproveConceptTitle'))->toBeTrue();
    expect($chairmanStatuses->get($data['submissionOne']->id))->toBe('Approved');
    expect($chairmanStatuses->get($data['submissionTwo']->id))->toBe('Rejected');

    $memberResponse = $this->actingAs($data['member'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.live-defense', [
            'group' => $data['group']->id,
        ]));

    $memberResponse->assertOk();

    $memberProps = data_get($memberResponse->viewData('page'), 'props', []);
    expect(data_get($memberProps, 'canApproveConceptTitle'))->toBeFalse();
});
