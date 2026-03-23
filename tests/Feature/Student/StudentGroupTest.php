<?php

use App\Models\AcademicYear;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupMember;
use App\Models\GroupPanelist;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('loads student group page with live group, adviser, panel, and progress data', function (): void {
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

    $adviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
    ]);

    $panelistOne = User::factory()->create([
        'role' => 'panelist',
        'first_name' => 'Luis',
        'last_name' => 'Aquino',
    ]);

    $panelistTwo = User::factory()->create([
        'role' => 'panelist',
        'first_name' => 'Rico',
        'last_name' => 'Tan',
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

    GroupAdviser::query()->create([
        'group_id' => $group->id,
        'adviser_id' => $adviser->id,
        'assigned_by' => $instructor->id,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $panelistOne->id,
        'panel_slot' => 1,
        'role' => 'chairman',
        'assigned_by' => $instructor->id,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $panelistTwo->id,
        'panel_slot' => 2,
        'role' => 'member',
        'assigned_by' => $instructor->id,
    ]);

    $room = DefenseRoom::query()->create([
        'name' => 'Room 101',
        'capacity' => 30,
        'is_active' => true,
    ]);

    DefenseSchedule::query()->create([
        'group_id' => $group->id,
        'room_id' => $room->id,
        'scheduled_date' => now()->addDays(7)->toDateString(),
        'start_time' => '09:00:00',
        'end_time' => '10:30:00',
        'stage' => 'Deployment',
        'status' => 'Scheduled',
        'scheduled_by' => $instructor->id,
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.group'));

    $response->assertOk();

    $pageProps = data_get($response->viewData('page'), 'props', []);

    expect(data_get($pageProps, 'group.name'))->toBe('Group Alpha');
    expect(data_get($pageProps, 'group.programSet'))->toBe('BSIT 4A');
    expect(data_get($pageProps, 'group.currentStage'))->toBe('Deployment');

    $memberNames = collect(data_get($pageProps, 'members', []))
        ->pluck('name')
        ->values()
        ->all();

    expect($memberNames)->toContain('Juan Dela Cruz');
    expect($memberNames)->toContain('Ana Santos');

    expect(data_get($pageProps, 'adviser.name'))->toBe('Maria Cruz');

    $panelistNames = collect(data_get($pageProps, 'panelists', []))
        ->pluck('name')
        ->values()
        ->all();

    expect($panelistNames)->toContain('Luis Aquino');
    expect($panelistNames)->toContain('Rico Tan');

    $currentProgress = collect(data_get($pageProps, 'progress', []))
        ->firstWhere('current', true);

    expect(data_get($currentProgress, 'label'))->toBe('Deployment');
});

it('returns fallback group props when student has no active group', function (): void {
    $student = User::factory()->create([
        'role' => 'student',
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.group'));

    $response->assertOk();

    $pageProps = data_get($response->viewData('page'), 'props', []);

    expect(data_get($pageProps, 'group'))->toBeNull();
    expect(data_get($pageProps, 'members'))->toBeArray()->toHaveCount(0);
    expect(data_get($pageProps, 'adviser'))->toBeNull();
    expect(data_get($pageProps, 'panelists'))->toBeArray()->toHaveCount(0);
    expect(data_get($pageProps, 'progress'))->toBeArray()->toHaveCount(5);
});
