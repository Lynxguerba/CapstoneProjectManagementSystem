<?php

use App\Models\AcademicYear;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\ProgramSet;
use App\Models\User;

it('blocks scheduling when concept requirements are not fully approved', function (): void {
    $context = createInstructorSchedulingContext();

    $requirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $context['academicYear']->id,
    ]);

    DocumentSubmission::factory()->create([
        'group_id' => $context['group']->id,
        'document_requirement_id' => $requirement->id,
        'status' => 'Submitted',
        'submitted_by' => $context['instructor']->id,
    ]);

    $response = $this
        ->actingAs($context['instructor'], 'web')
        ->withSession(['active_role' => 'instructor'])
        ->from(route('instructor.scheduling.manage'))
        ->post(route('instructor.defense-schedules.upsert'), buildSchedulePayload($context['group']->id, $context['room']->id));

    $response
        ->assertRedirect(route('instructor.scheduling.manage'))
        ->assertSessionHasErrors([
            'group_id' => 'Approve all required documents before scheduling this defense.',
        ]);

    expect(DefenseSchedule::query()->count())->toBe(0);
});

it('allows scheduling when all applicable concept requirements are approved', function (): void {
    $context = createInstructorSchedulingContext();

    $conceptRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $context['academicYear']->id,
    ]);

    $recommendationRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Adviser Recommendation Letter',
        'stage' => 'Concept',
        'academic_year_id' => $context['academicYear']->id,
    ]);

    DocumentSubmission::factory()->create([
        'group_id' => $context['group']->id,
        'document_requirement_id' => $conceptRequirement->id,
        'status' => 'Approved',
        'submitted_by' => $context['instructor']->id,
    ]);

    DocumentSubmission::factory()->create([
        'group_id' => $context['group']->id,
        'document_requirement_id' => $recommendationRequirement->id,
        'status' => 'Submitted',
        'submitted_by' => $context['instructor']->id,
    ]);

    $response = $this
        ->actingAs($context['instructor'], 'web')
        ->withSession(['active_role' => 'instructor'])
        ->from(route('instructor.scheduling.manage'))
        ->post(route('instructor.defense-schedules.upsert'), buildSchedulePayload($context['group']->id, $context['room']->id));

    $response
        ->assertRedirect(route('instructor.scheduling.manage'))
        ->assertSessionHas('success', 'Defense schedule saved successfully.');

    expect(DefenseSchedule::query()->count())->toBe(1);

    $savedSchedule = DefenseSchedule::query()->first();

    expect($savedSchedule)->not->toBeNull();
    expect($savedSchedule?->group_id)->toBe($context['group']->id);
    expect($savedSchedule?->room_id)->toBe($context['room']->id);
    expect($savedSchedule?->stage)->toBe('Concept');
});

/**
 * @return array{instructor: User, group: Group, room: DefenseRoom, academicYear: AcademicYear}
 */
function createInstructorSchedulingContext(): array
{
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $leader = User::factory()->create([
        'role' => 'student',
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
        'leader_id' => $leader->id,
        'name' => 'Group Atlas',
    ]);

    foreach ([1, 2, 3] as $slot) {
        $panelist = User::factory()->create([
            'role' => 'panelist',
        ]);

        GroupPanelist::query()->create([
            'group_id' => $group->id,
            'panelist_id' => $panelist->id,
            'panel_slot' => $slot,
            'role' => $slot === 1 ? 'chairman' : 'member',
            'assigned_by' => $instructor->id,
        ]);
    }

    $room = DefenseRoom::factory()->create([
        'is_active' => true,
    ]);

    return [
        'instructor' => $instructor,
        'group' => $group,
        'room' => $room,
        'academicYear' => $academicYear,
    ];
}

/**
 * @return array{group_id: int, room_id: int, scheduled_date: string, start_time: string, end_time: string, stage: string}
 */
function buildSchedulePayload(int $groupId, int $roomId): array
{
    return [
        'group_id' => $groupId,
        'room_id' => $roomId,
        'scheduled_date' => '2026-04-10',
        'start_time' => '09:00',
        'end_time' => '10:00',
        'stage' => 'Concept',
    ];
}
