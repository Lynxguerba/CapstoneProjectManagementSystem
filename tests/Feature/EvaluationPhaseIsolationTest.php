<?php

use App\Models\AcademicYear;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\Group;
use App\Models\GroupDefenseVerdict;
use App\Models\GroupPanelist;
use App\Models\PanelistEvaluationSheetSignature;
use App\Models\ProgramSet;
use App\Models\User;

it('loads the matching panelist evaluation sheet signature for the requested phase', function (): void {
    $context = seedEvaluationPhaseIsolationContext();

    $conceptResponse = $this
        ->actingAs($context['panelist'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.live-defense.evaluation-sheet', [
            'group' => $context['group']->id,
            'stage' => 'Concept',
        ]));

    $conceptResponse->assertOk();

    $conceptProps = data_get($conceptResponse->viewData('page'), 'props', []);

    expect(data_get($conceptProps, 'defenseTypeKey'))->toBe('concept_presentation');
    expect(data_get($conceptProps, 'defenseHeaderTitle'))->toBe('CONCEPT TITLE DEFENSE');
    expect(data_get($conceptProps, 'evaluationSheetData.groupScores.total'))->toBe(11);
    expect(data_get($conceptProps, 'evaluationSheetData.presenters'))->toBe([$context['leader']->name]);

    $outlineResponse = $this
        ->actingAs($context['panelist'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.live-defense.evaluation-sheet', [
            'group' => $context['group']->id,
            'stage' => 'Outline',
        ]));

    $outlineResponse->assertOk();

    $outlineProps = data_get($outlineResponse->viewData('page'), 'props', []);

    expect(data_get($outlineProps, 'defenseTypeKey'))->toBe('outline_defense');
    expect(data_get($outlineProps, 'defenseHeaderTitle'))->toBe('OUTLINE DEFENSE');
    expect(data_get($outlineProps, 'evaluationSheetData.groupScores.total'))->toBe(22);
    expect(data_get($outlineProps, 'evaluationSheetData.presenters'))->toBe([$context['leader']->name]);
});

it('loads instructor review data for the explicitly requested phase instead of the latest schedule phase', function (): void {
    $context = seedEvaluationPhaseIsolationContext();

    $conceptResponse = $this
        ->actingAs($context['instructor'], 'web')
        ->withSession(['active_role' => 'instructor'])
        ->get(route('instructor.requirements.documents.evaluation', [
            'group' => $context['group']->id,
            'panelist' => $context['panelist']->id,
            'stage' => 'Concept',
        ]));

    $conceptResponse->assertOk();

    $conceptProps = data_get($conceptResponse->viewData('page'), 'props', []);
    $conceptPanelistRow = collect(data_get($conceptProps, 'panelists', []))
        ->firstWhere('id', $context['panelist']->id);

    expect(data_get($conceptProps, 'activeStage'))->toBe('Concept');
    expect(data_get($conceptProps, 'defenseHeaderTitle'))->toBe('CONCEPT TITLE DEFENSE');
    expect(data_get($conceptPanelistRow, 'evaluationData.groupScores.total'))->toBe(11);
    expect(data_get($conceptPanelistRow, 'evaluationData.presenters'))->toBe([$context['leader']->name]);

    $outlineResponse = $this
        ->actingAs($context['instructor'], 'web')
        ->withSession(['active_role' => 'instructor'])
        ->get(route('instructor.requirements.documents.evaluation', [
            'group' => $context['group']->id,
            'panelist' => $context['panelist']->id,
            'stage' => 'Outline',
        ]));

    $outlineResponse->assertOk();

    $outlineProps = data_get($outlineResponse->viewData('page'), 'props', []);
    $outlinePanelistRow = collect(data_get($outlineProps, 'panelists', []))
        ->firstWhere('id', $context['panelist']->id);

    expect(data_get($outlineProps, 'activeStage'))->toBe('Outline');
    expect(data_get($outlineProps, 'defenseHeaderTitle'))->toBe('OUTLINE DEFENSE');
    expect(data_get($outlinePanelistRow, 'evaluationData.groupScores.total'))->toBe(22);
    expect(data_get($outlinePanelistRow, 'evaluationData.presenters'))->toBe([$context['leader']->name]);
});

it('loads the matching verdict text for the requested phase on the panelist evaluation sheet', function (): void {
    $context = seedEvaluationPhaseIsolationContext();

    $context['group']->update([
        'concept_verdict' => 'Passed (No revisions needed)',
        'concept_verdict_by_panelist_id' => $context['panelist']->id,
        'concept_verdict_decided_at' => now(),
    ]);

    GroupDefenseVerdict::query()->create([
        'group_id' => $context['group']->id,
        'stage' => 'Outline',
        'verdict' => 'Conditional Passed',
        'panelist_user_id' => $context['panelist']->id,
        'decided_at' => now(),
    ]);

    $conceptResponse = $this
        ->actingAs($context['panelist'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.live-defense.evaluation-sheet', [
            'group' => $context['group']->id,
            'stage' => 'Concept',
        ]));

    $conceptResponse->assertOk();

    $outlineResponse = $this
        ->actingAs($context['panelist'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.live-defense.evaluation-sheet', [
            'group' => $context['group']->id,
            'stage' => 'Outline',
        ]));

    $outlineResponse->assertOk();

    expect(data_get($conceptResponse->viewData('page'), 'props.conceptVerdict'))->toBe('Passed (No revisions needed)');
    expect(data_get($outlineResponse->viewData('page'), 'props.conceptVerdict'))->toBe('Conditional Passed');
});

it('uses the outline verdict status on the panelist schedule rows for phase 2', function (): void {
    $context = seedEvaluationPhaseIsolationContext();

    GroupDefenseVerdict::query()->create([
        'group_id' => $context['group']->id,
        'stage' => 'Outline',
        'verdict' => 'Conditional Passed',
        'panelist_user_id' => $context['panelist']->id,
        'decided_at' => now(),
    ]);

    $response = $this
        ->actingAs($context['panelist'], 'web')
        ->withSession(['active_role' => 'panelist'])
        ->get(route('panelist.schedule'));

    $response->assertOk();

    $rows = collect(data_get($response->viewData('page'), 'props.rows', []));
    $outlineRow = $rows->firstWhere('id', $context['group']->id.':phase2');

    expect(data_get($outlineRow, 'defenseType'))->toBe('Outline');
    expect(data_get($outlineRow, 'evaluationStatus'))->toBe('Conditional');
});

/**
 * @return array{academicYear: AcademicYear, instructor: User, panelist: User, leader: User, group: Group}
 */
function seedEvaluationPhaseIsolationContext(): array
{
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $panelist = User::factory()->create([
        'role' => 'panelist',
    ]);
    $leader = User::factory()->create([
        'role' => 'student',
    ]);

    $academicYear = AcademicYear::factory()->create([
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
        'name' => 'Group Helios',
    ]);

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $panelist->id,
        'panel_slot' => 1,
        'role' => 'chairman',
        'assigned_by' => $instructor->id,
    ]);

    $room = DefenseRoom::factory()->create();

    DefenseSchedule::query()->create([
        'group_id' => $group->id,
        'room_id' => $room->id,
        'scheduled_date' => '2026-04-10',
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'stage' => 'Concept',
        'status' => 'Completed',
        'scheduled_by' => $instructor->id,
    ]);

    DefenseSchedule::query()->create([
        'group_id' => $group->id,
        'room_id' => $room->id,
        'scheduled_date' => '2026-05-10',
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'stage' => 'Outline',
        'status' => 'Scheduled',
        'scheduled_by' => $instructor->id,
    ]);

    PanelistEvaluationSheetSignature::query()->create([
        'group_id' => $group->id,
        'defense_type_key' => 'concept_presentation',
        'panelist_user_id' => $panelist->id,
        'defense_date' => '2026-04-10',
        'presenters' => [$leader->name],
        'individual_scores' => [
            'disposition' => 4,
            'organization' => 4,
            'manner' => 4,
            'defense' => 4,
        ],
        'group_scores' => [
            'system' => 5,
            'documentation' => 6,
            'total' => 11,
        ],
        'passing_grade_date' => '2026-04-11',
        'signed_at' => now(),
        'signed_by_user_id' => $panelist->id,
    ]);

    PanelistEvaluationSheetSignature::query()->create([
        'group_id' => $group->id,
        'defense_type_key' => 'outline_defense',
        'panelist_user_id' => $panelist->id,
        'defense_date' => '2026-05-10',
        'presenters' => [$leader->name],
        'individual_scores' => [
            'disposition' => 5,
            'organization' => 5,
            'manner' => 5,
            'defense' => 5,
        ],
        'group_scores' => [
            'system' => 10,
            'documentation' => 12,
            'total' => 22,
        ],
        'passing_grade_date' => '2026-05-11',
        'signed_at' => now(),
        'signed_by_user_id' => $panelist->id,
    ]);

    return [
        'academicYear' => $academicYear,
        'instructor' => $instructor,
        'panelist' => $panelist,
        'leader' => $leader,
        'group' => $group,
    ];
}
