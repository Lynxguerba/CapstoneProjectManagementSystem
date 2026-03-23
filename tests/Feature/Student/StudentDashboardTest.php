<?php

use App\Models\AcademicYear;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('loads student dashboard with database-driven metrics', function (): void {
    $student = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
    ]);

    $teammate = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Ana',
        'last_name' => 'Santos',
    ]);

    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $academicYear = AcademicYear::query()->create([
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
        'leader_id' => $student->id,
        'name' => 'Group Alpha',
    ]);

    GroupMember::query()->create([
        'group_id' => $group->id,
        'student_id' => $teammate->id,
        'role' => 'Programmer',
    ]);

    $requirement = DocumentRequirement::query()->create([
        'requirement_type' => 'Concept Paper',
        'due_date' => now()->addDays(5)->toDateString(),
        'stage' => 'Concept',
        'is_mandatory' => true,
        'academic_year_id' => $academicYear->id,
        'created_by' => $instructor->id,
    ]);

    DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $requirement->id,
        'file_name' => 'concept-v1.pdf',
        'file_path' => 'documents/concept-v1.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 10240,
        'status' => 'Approved',
        'submitted_by' => $student->id,
    ]);

    DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $requirement->id,
        'file_name' => 'concept-v2.pdf',
        'file_path' => 'documents/concept-v2.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 11240,
        'status' => 'Submitted',
        'submitted_by' => $student->id,
    ]);

    $room = DefenseRoom::query()->create([
        'name' => 'Room 101',
        'capacity' => 30,
        'is_active' => true,
    ]);

    DefenseSchedule::query()->create([
        'group_id' => $group->id,
        'room_id' => $room->id,
        'scheduled_date' => now()->addDays(3)->toDateString(),
        'start_time' => '09:00:00',
        'end_time' => '10:30:00',
        'stage' => 'Outline',
        'status' => 'Scheduled',
        'scheduled_by' => $instructor->id,
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.dashboard'));

    $response->assertOk();

    $pageProps = data_get($response->viewData('page'), 'props', []);

    expect(data_get($pageProps, 'groupName'))->toBe('Group Alpha');
    expect(data_get($pageProps, 'stage.label'))->toBe('Outline');
    expect(data_get($pageProps, 'stats.approvedSubmissions'))->toBe(1);
    expect(data_get($pageProps, 'stats.inReviewSubmissions'))->toBe(1);
    expect(data_get($pageProps, 'stats.teamMembers'))->toBe(2);
    expect(data_get($pageProps, 'nextDeadline.requirementType'))->toBe('Concept Paper');

    $teamMemberNames = collect(data_get($pageProps, 'teamMembers', []))
        ->pluck('name')
        ->values()
        ->all();

    expect($teamMemberNames)->toContain('Juan Dela Cruz');
    expect($teamMemberNames)->toContain('Ana Santos');

    $approvedTitles = collect(data_get($pageProps, 'recentApprovedSubmissions', []))
        ->pluck('title')
        ->values()
        ->all();

    expect($approvedTitles)->toContain('Concept Paper');
});

it('returns safe student dashboard fallbacks when no group exists', function (): void {
    $student = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Solo',
        'last_name' => 'Student',
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.dashboard'));

    $response->assertOk();

    $pageProps = data_get($response->viewData('page'), 'props', []);

    expect(data_get($pageProps, 'groupName'))->toBeNull();
    expect(data_get($pageProps, 'stats.approvedSubmissions'))->toBe(0);
    expect(data_get($pageProps, 'stats.inReviewSubmissions'))->toBe(0);
    expect(data_get($pageProps, 'stats.teamMembers'))->toBe(0);
    expect(data_get($pageProps, 'teamMembers'))->toBeArray()->toHaveCount(0);
});
