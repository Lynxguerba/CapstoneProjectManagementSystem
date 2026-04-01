<?php

use App\Models\AcademicYear;
use App\Models\CrossSetGroupRequest;
use App\Models\Group;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns students from another set handled by the same instructor in cross-set search', function (): void {
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => true,
    ]);

    $programSetA = ProgramSet::query()->create([
        'name' => 'BSIT A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $programSetB = ProgramSet::query()->create([
        'name' => 'BSIT B',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $crossSetCandidate = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Paula',
        'last_name' => 'Reyes',
        'name' => 'Paula Reyes',
    ]);

    $localStudent = User::factory()->create([
        'role' => 'student',
        'first_name' => 'Paolo',
        'last_name' => 'Santos',
        'name' => 'Paolo Santos',
    ]);

    $programSetB->students()->attach($crossSetCandidate->id);
    $programSetA->students()->attach($localStudent->id);

    $response = $this
        ->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->getJson(route('instructor.students.cross-set-search', [
            'q' => 'Paula',
            'program_set_id' => $programSetA->id,
        ]));

    $response->assertOk();

    $resultIds = collect($response->json('students', []))
        ->pluck('id')
        ->values()
        ->all();

    expect($resultIds)
        ->toContain($crossSetCandidate->id)
        ->not->toContain($localStudent->id);
});

it('auto-approves cross-set requests for students from another set handled by the same instructor', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => true,
    ]);

    $programSetA = ProgramSet::query()->create([
        'name' => 'BSIT A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $programSetB = ProgramSet::query()->create([
        'name' => 'BSIT B',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $leader = User::factory()->create([
        'role' => 'student',
    ]);
    $programSetA->students()->attach($leader->id);

    $group = Group::query()->create([
        'program_set_id' => $programSetA->id,
        'leader_id' => $leader->id,
        'name' => 'Leader',
    ]);

    $crossSetCandidate = User::factory()->create([
        'role' => 'student',
    ]);
    $programSetB->students()->attach($crossSetCandidate->id);

    $this->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->post(route('instructor.groups.cross-set-request.store'), [
            'group_id' => $group->id,
            'student_id' => $crossSetCandidate->id,
        ])
        ->assertRedirect();

    $crossSetRequest = CrossSetGroupRequest::query()
        ->where('group_id', $group->id)
        ->where('student_id', $crossSetCandidate->id)
        ->first();

    expect($crossSetRequest)->not->toBeNull();
    expect($crossSetRequest?->status)->toBe('approved');
    expect($crossSetRequest?->responded_at)->not->toBeNull();

    $this->assertDatabaseHas('cross_set_group_requests', [
        'group_id' => $group->id,
        'student_id' => $crossSetCandidate->id,
        'requested_by' => $instructor->id,
        'requested_to' => $instructor->id,
        'from_program_set_id' => $programSetA->id,
        'to_program_set_id' => $programSetB->id,
        'status' => 'approved',
    ]);

    $this->assertDatabaseHas('group_members', [
        'group_id' => $group->id,
        'student_id' => $crossSetCandidate->id,
        'role' => 'Programmer',
        'is_cross_set' => 1,
    ]);

    $this->assertDatabaseHas('groups', [
        'id' => $group->id,
        'is_cross_set' => 1,
    ]);
});

it('keeps cross-set requests pending when the target student is handled by another instructor', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $otherInstructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => true,
    ]);

    $programSetA = ProgramSet::query()->create([
        'name' => 'BSIT A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $programSetC = ProgramSet::query()->create([
        'name' => 'BSIT C',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $otherInstructor->id,
    ]);

    $leader = User::factory()->create([
        'role' => 'student',
    ]);
    $programSetA->students()->attach($leader->id);

    $group = Group::query()->create([
        'program_set_id' => $programSetA->id,
        'leader_id' => $leader->id,
        'name' => 'Leader',
    ]);

    $crossSetCandidate = User::factory()->create([
        'role' => 'student',
    ]);
    $programSetC->students()->attach($crossSetCandidate->id);

    $this->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->post(route('instructor.groups.cross-set-request.store'), [
            'group_id' => $group->id,
            'student_id' => $crossSetCandidate->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('cross_set_group_requests', [
        'group_id' => $group->id,
        'student_id' => $crossSetCandidate->id,
        'requested_by' => $instructor->id,
        'requested_to' => $otherInstructor->id,
        'from_program_set_id' => $programSetA->id,
        'to_program_set_id' => $programSetC->id,
        'status' => 'pending',
    ]);

    $this->assertDatabaseMissing('group_members', [
        'group_id' => $group->id,
        'student_id' => $crossSetCandidate->id,
    ]);
});
