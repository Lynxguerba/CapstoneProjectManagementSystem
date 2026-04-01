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

    $candidateRow = collect($response->json('students', []))
        ->firstWhere('id', $crossSetCandidate->id);

    expect($resultIds)
        ->toContain($crossSetCandidate->id)
        ->not->toContain($localStudent->id);

    expect((bool) ($candidateRow['is_self_managed'] ?? false))->toBeTrue();
});

it('matches cross-set students using multi-word full-name search even when display name is empty', function (): void {
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
        'name' => '',
        'first_name' => 'Paula',
        'last_name' => 'Reyes',
    ]);
    $programSetB->students()->attach($crossSetCandidate->id);

    $response = $this
        ->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->getJson(route('instructor.students.cross-set-search', [
            'q' => 'Paula Reyes',
            'program_set_id' => $programSetA->id,
        ]));

    $response->assertOk();

    $resultIds = collect($response->json('students', []))
        ->pluck('id')
        ->values()
        ->all();

    expect($resultIds)->toContain($crossSetCandidate->id);
});

it('adds cross-set students directly without creating requests when instructor handles both sets', function (): void {
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

    $this->assertDatabaseMissing('cross_set_group_requests', [
        'group_id' => $group->id,
        'student_id' => $crossSetCandidate->id,
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

it('allows updating group members with cross-set students from another handled set', function (): void {
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

    $leader = User::factory()->create(['role' => 'student']);
    $localMember = User::factory()->create(['role' => 'student']);
    $crossSetMember = User::factory()->create(['role' => 'student']);

    $programSetA->students()->attach([$leader->id, $localMember->id]);
    $programSetB->students()->attach($crossSetMember->id);

    $group = Group::query()->create([
        'program_set_id' => $programSetA->id,
        'leader_id' => $leader->id,
        'name' => 'Leader Group',
    ]);

    $group->members()->sync([
        $leader->id => ['role' => 'Project Manager'],
        $localMember->id => ['role' => 'Programmer'],
    ]);

    $this->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->put(route('instructor.groups.members.update', ['group' => $group->id]), [
            'members' => [
                [
                    'student_id' => $leader->id,
                    'role' => 'Project Manager',
                ],
                [
                    'student_id' => $crossSetMember->id,
                    'role' => 'Programmer',
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('group_members', [
        'group_id' => $group->id,
        'student_id' => $crossSetMember->id,
        'role' => 'Programmer',
        'is_cross_set' => 1,
    ]);

    $this->assertDatabaseHas('groups', [
        'id' => $group->id,
        'is_cross_set' => 1,
    ]);

    $this->assertDatabaseMissing('cross_set_group_requests', [
        'group_id' => $group->id,
        'student_id' => $crossSetMember->id,
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

it('approves and rejects incoming cross-set requests from target instructor actions', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $requestingInstructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $targetInstructor = User::factory()->create([
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
        'instructor_id' => $requestingInstructor->id,
    ]);

    $programSetB = ProgramSet::query()->create([
        'name' => 'BSIT B',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $targetInstructor->id,
    ]);

    $leader = User::factory()->create([
        'role' => 'student',
    ]);
    $programSetA->students()->attach($leader->id);

    $group = Group::query()->create([
        'program_set_id' => $programSetA->id,
        'leader_id' => $leader->id,
        'name' => 'Leader Group',
    ]);

    $studentForApproval = User::factory()->create([
        'role' => 'student',
    ]);
    $studentForRejection = User::factory()->create([
        'role' => 'student',
    ]);

    $programSetB->students()->attach([$studentForApproval->id, $studentForRejection->id]);

    $approvalRequest = CrossSetGroupRequest::query()->create([
        'group_id' => $group->id,
        'student_id' => $studentForApproval->id,
        'requested_by' => $requestingInstructor->id,
        'requested_to' => $targetInstructor->id,
        'from_program_set_id' => $programSetA->id,
        'to_program_set_id' => $programSetB->id,
        'status' => 'pending',
    ]);

    $rejectionRequest = CrossSetGroupRequest::query()->create([
        'group_id' => $group->id,
        'student_id' => $studentForRejection->id,
        'requested_by' => $requestingInstructor->id,
        'requested_to' => $targetInstructor->id,
        'from_program_set_id' => $programSetA->id,
        'to_program_set_id' => $programSetB->id,
        'status' => 'pending',
    ]);

    $this->actingAs($targetInstructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->patch(route('instructor.groups.cross-set-request.approve', ['crossSetRequest' => $approvalRequest->id]))
        ->assertRedirect();

    $this->assertDatabaseHas('cross_set_group_requests', [
        'id' => $approvalRequest->id,
        'status' => 'approved',
    ]);

    $this->assertDatabaseHas('group_members', [
        'group_id' => $group->id,
        'student_id' => $studentForApproval->id,
        'is_cross_set' => 1,
    ]);

    $this->actingAs($targetInstructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->patch(route('instructor.groups.cross-set-request.reject', ['crossSetRequest' => $rejectionRequest->id]), [
            'remarks' => 'No available slot.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('cross_set_group_requests', [
        'id' => $rejectionRequest->id,
        'status' => 'rejected',
        'remarks' => 'No available slot.',
    ]);

    $this->assertDatabaseMissing('group_members', [
        'group_id' => $group->id,
        'student_id' => $studentForRejection->id,
    ]);
});
