<?php

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\PanelistAvailability;
use App\Models\PanelistProgramUtility;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('blocks assignment when selected panelist is closed for new group assignments', function (): void {
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $panelist = User::factory()->create([
        'role' => 'panelist',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => true,
    ]);

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT 4A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $leader = User::factory()->create([
        'role' => 'student',
    ]);

    $group = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $leader->id,
        'name' => 'Alpha',
    ]);

    PanelistAvailability::query()->create([
        'panelist_id' => $panelist->id,
        'is_available' => false,
    ]);

    $this->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->post(route('instructor.panelist-assignment.assign'), [
            'group_id' => $group->id,
            'panelist_id' => $panelist->id,
            'panel_role' => 'member',
        ])
        ->assertSessionHasErrors([
            'panelist_id' => 'Selected panelist is currently closed for new group assignments.',
        ]);

    $this->assertDatabaseMissing('group_panelists', [
        'group_id' => $group->id,
        'panelist_id' => $panelist->id,
    ]);
});

it('blocks assignment when selected panelist reached per-program capacity for the same academic year', function (): void {
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $panelist = User::factory()->create([
        'role' => 'panelist',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => true,
    ]);

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT 4B',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $firstLeader = User::factory()->create([
        'role' => 'student',
    ]);
    $firstGroup = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $firstLeader->id,
        'name' => 'Beta',
    ]);

    $secondLeader = User::factory()->create([
        'role' => 'student',
    ]);
    $secondGroup = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $secondLeader->id,
        'name' => 'Gamma',
    ]);

    PanelistAvailability::query()->create([
        'panelist_id' => $panelist->id,
        'is_available' => true,
    ]);

    PanelistProgramUtility::query()->create([
        'panelist_id' => $panelist->id,
        'program' => 'BSIT',
        'max_groups' => 1,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $firstGroup->id,
        'panelist_id' => $panelist->id,
        'panel_slot' => 1,
        'role' => 'chairman',
        'assigned_by' => $instructor->id,
    ]);

    $this->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->post(route('instructor.panelist-assignment.assign'), [
            'group_id' => $secondGroup->id,
            'panelist_id' => $panelist->id,
            'panel_role' => 'member',
        ])
        ->assertSessionHasErrors([
            'panelist_id' => 'Selected panelist already reached 1 BSIT groups for 2025-2026.',
        ]);

    $this->assertDatabaseMissing('group_panelists', [
        'group_id' => $secondGroup->id,
        'panelist_id' => $panelist->id,
    ]);
});

it('blocks assignment when program casing and spacing differ from saved panelist utility', function (): void {
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $panelist = User::factory()->create([
        'role' => 'panelist',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => true,
    ]);

    $firstProgramSet = ProgramSet::query()->create([
        'name' => 'BSIT 4A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $secondProgramSet = ProgramSet::query()->create([
        'name' => 'BSIT 4B',
        'program' => ' bsit ',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $firstLeader = User::factory()->create([
        'role' => 'student',
    ]);
    $firstGroup = Group::query()->create([
        'program_set_id' => $firstProgramSet->id,
        'leader_id' => $firstLeader->id,
        'name' => 'Delta',
    ]);

    $secondLeader = User::factory()->create([
        'role' => 'student',
    ]);
    $secondGroup = Group::query()->create([
        'program_set_id' => $secondProgramSet->id,
        'leader_id' => $secondLeader->id,
        'name' => 'Epsilon',
    ]);

    PanelistAvailability::query()->create([
        'panelist_id' => $panelist->id,
        'is_available' => true,
    ]);

    PanelistProgramUtility::query()->create([
        'panelist_id' => $panelist->id,
        'program' => 'BSIT',
        'max_groups' => 1,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $firstGroup->id,
        'panelist_id' => $panelist->id,
        'panel_slot' => 1,
        'role' => 'chairman',
        'assigned_by' => $instructor->id,
    ]);

    $this->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->post(route('instructor.panelist-assignment.assign'), [
            'group_id' => $secondGroup->id,
            'panelist_id' => $panelist->id,
            'panel_role' => 'member',
        ])
        ->assertSessionHasErrors([
            'panelist_id' => 'Selected panelist already reached 1 BSIT groups for 2025-2026.',
        ]);

    $this->assertDatabaseMissing('group_panelists', [
        'group_id' => $secondGroup->id,
        'panelist_id' => $panelist->id,
    ]);
});
