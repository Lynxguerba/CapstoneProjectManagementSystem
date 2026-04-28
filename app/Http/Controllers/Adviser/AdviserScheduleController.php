<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\DefenseSchedule;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdviserScheduleController extends Controller
{
    /**
     * @var array<string, string>
     */
    private const PHASE_STAGE_MAP = [
        'phase1' => 'Concept',
        'phase2' => 'Outline',
        'phase3' => 'Pre-Deployment',
        'phase4' => 'Deployment',
        'phase5' => 'Final',
    ];

    public function __invoke(): Response
    {
        /** @var User|null $adviser */
        $adviser = Auth::guard('web')->user();
        $adviserId = $adviser?->id;
        $assignedGroups = $this->resolveAssignedGroups($adviserId);
        $titlesByGroupIdAndStage = $this->resolveTitlesByGroupIdAndStage($assignedGroups);
        $schedulesByGroupStage = $this->resolveSchedulesByGroupStage($assignedGroups);

        $rows = $assignedGroups
            ->flatMap(function (Group $group) use ($titlesByGroupIdAndStage, $schedulesByGroupStage): Collection {
                return collect(self::PHASE_STAGE_MAP)
                    ->map(function (string $stage, string $phaseKey) use ($titlesByGroupIdAndStage, $group, $schedulesByGroupStage): array {
                        $schedule = $schedulesByGroupStage->get($this->scheduleMapKey($group->id, $stage));
                        $groupLabel = $this->formatGroupName($group->name);

                        $groupTitles = $titlesByGroupIdAndStage->get($group->id);
                        $stageTitle = $groupTitles?->get($stage);

                        if (! is_string($stageTitle) || trim($stageTitle) === '') {
                            $stageTitle = $groupTitles?->first();
                        }

                        $projectTitle = is_string($stageTitle) && trim($stageTitle) !== '' ? trim($stageTitle) : $groupLabel;
                        $programSetName = $this->resolveProgramSetName($group);
                        $academicYear = $group->programSet?->academicYear?->label ?? $group->programSet?->school_year;

                        return [
                            'id' => $group->id.':'.$phaseKey,
                            'phase' => $phaseKey,
                            'date' => $this->formatScheduleDate($schedule),
                            'time' => $this->formatScheduleTime($schedule),
                            'room' => $this->resolveScheduleRoom($schedule),
                            'defenseType' => $stage,
                            'projectTitle' => $projectTitle,
                            'defenseStatus' => $this->resolveDefenseStatus($schedule),
                            'evaluationStatus' => $this->resolveEvaluationStatus($schedule, $group, $stage),
                            'group' => [
                                'id' => (string) $group->id,
                                'groupName' => $groupLabel,
                                'programSetName' => $programSetName,
                                'academicYear' => $academicYear,
                                'members' => $this->resolveGroupMembers($group),
                                'adviser' => $this->resolveAdviser($group),
                                'coPanelists' => $this->resolvePanelists($group),
                            ],
                        ];
                    })
                    ->values();
            })
            ->values()
            ->all();

        return Inertia::render('Adviser/schedule', [
            'rows' => $rows,
        ]);
    }

    /**
     * @return Collection<int, Group>
     */
    private function resolveAssignedGroups(?int $adviserId): Collection
    {
        if (
            $adviserId === null
            || ! Schema::hasTable('groups')
            || ! Schema::hasTable('group_advisers')
        ) {
            return collect();
        }

        $groupColumns = ['id', 'name', 'program_set_id', 'leader_id'];

        if (Schema::hasColumn('groups', 'concept_verdict')) {
            $groupColumns[] = 'concept_verdict';
        }

        return Group::query()
            ->with([
                'programSet.academicYear',
                'leader',
                'members',
                'adviserAssignment.adviser',
                'panelAssignments.panelist',
            ])
            ->whereHas('adviserAssignment', fn (Builder $query): Builder => $query->where('adviser_id', $adviserId))
            ->orderBy('name')
            ->get($groupColumns);
    }

    /**
     * @param  Collection<int, Group>  $assignedGroups
     * @return Collection<int, Collection<string, string>>
     */
    private function resolveTitlesByGroupIdAndStage(Collection $assignedGroups): Collection
    {
        if (
            $assignedGroups->isEmpty()
            || ! Schema::hasTable('document_submissions')
            || ! Schema::hasTable('document_requirements')
        ) {
            return collect();
        }

        $groupIds = $assignedGroups
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->values()
            ->all();

        $submissions = DocumentSubmission::query()
            ->with('requirement:id,requirement_type,stage')
            ->whereIn('group_id', $groupIds)
            ->whereHas('requirement', function (Builder $query): void {
                $query->whereIn('stage', array_values(self::PHASE_STAGE_MAP));
            })
            ->orderByDesc('created_at')
            ->get(['id', 'group_id', 'document_requirement_id', 'file_name', 'created_at']);

        return $submissions
            ->groupBy('group_id')
            ->map(function (Collection $groupSubmissions): Collection {
                return $groupSubmissions
                    ->filter(function (DocumentSubmission $submission) {
                        $requirementType = strtolower($submission->requirement?->requirement_type ?? '');
                        $fileName = strtolower($submission->file_name ?? '');

                        return ! str_contains($requirementType, 'recommendation')
                            && ! str_contains($fileName, 'recommendation');
                    })
                    ->groupBy(fn (DocumentSubmission $sub) => $sub->requirement?->stage)
                    ->map(fn (Collection $stageSubmissions) => trim($stageSubmissions->first()->file_name ?? ''));
            });
    }

    /**
     * @param  Collection<int, Group>  $assignedGroups
     * @return Collection<string, DefenseSchedule>
     */
    private function resolveSchedulesByGroupStage(Collection $assignedGroups): Collection
    {
        if ($assignedGroups->isEmpty() || ! Schema::hasTable('defense_schedules')) {
            return collect();
        }

        $groupIds = $assignedGroups
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->values()
            ->all();

        $scheduleQuery = DefenseSchedule::query()
            ->whereIn('group_id', $groupIds)
            ->orderByDesc('scheduled_date')
            ->orderByDesc('start_time');

        if (Schema::hasTable('defense_rooms')) {
            $scheduleQuery->with('room:id,name');
        }

        $mappedSchedules = collect();

        $scheduleQuery
            ->get(['id', 'group_id', 'room_id', 'scheduled_date', 'start_time', 'stage', 'status'])
            ->each(function (DefenseSchedule $schedule) use ($mappedSchedules): void {
                $normalizedStage = trim((string) $schedule->stage);
                $key = $this->scheduleMapKey($schedule->group_id, $normalizedStage);

                if (! $mappedSchedules->has($key)) {
                    $mappedSchedules->put($key, $schedule);
                }
            });

        return $mappedSchedules;
    }

    private function scheduleMapKey(int $groupId, string $stage): string
    {
        return $groupId.':'.strtolower(trim($stage));
    }

    private function formatScheduleDate(?DefenseSchedule $schedule): string
    {
        if (! $schedule instanceof DefenseSchedule) {
            return 'TBD';
        }

        return $schedule->scheduled_date?->format('Y-m-d') ?? 'TBD';
    }

    private function formatScheduleTime(?DefenseSchedule $schedule): string
    {
        if (! $schedule instanceof DefenseSchedule || ! is_string($schedule->start_time)) {
            return 'TBD';
        }

        $time = Carbon::createFromFormat('H:i:s', $schedule->start_time);
        if ($time === false) {
            return $schedule->start_time;
        }

        return $time->format('g:i A');
    }

    private function resolveScheduleRoom(?DefenseSchedule $schedule): string
    {
        if (! $schedule instanceof DefenseSchedule) {
            return 'TBD';
        }

        $roomName = is_string($schedule->room?->name) ? trim($schedule->room->name) : '';
        if ($roomName !== '') {
            return $roomName;
        }

        return 'TBD';
    }

    private function resolveDefenseStatus(?DefenseSchedule $schedule): string
    {
        $status = is_string($schedule?->status) ? trim($schedule->status) : '';

        if ($status === 'Completed') {
            return 'Completed';
        }

        if ($status === 'Scheduled') {
            return 'In Progress';
        }

        return 'Pending';
    }

    private function resolveEvaluationStatus(?DefenseSchedule $schedule, Group $group, string $stage): string
    {
        $normalizedStage = strtolower(trim($stage));

        if ($normalizedStage === 'concept') {
            $conceptVerdictStatus = $this->resolveConceptVerdictEvaluationStatus($group);
            if ($conceptVerdictStatus !== null) {
                return $conceptVerdictStatus;
            }
        }

        if (! $schedule instanceof DefenseSchedule) {
            return 'Pending';
        }

        $status = is_string($schedule->status) ? trim($schedule->status) : '';

        if ($status === 'Completed') {
            return 'Defended';
        }

        return 'Pending';
    }

    private function resolveConceptVerdictEvaluationStatus(Group $group): ?string
    {
        $conceptVerdict = is_string($group->concept_verdict) ? trim($group->concept_verdict) : '';

        if (
            in_array($conceptVerdict, [
                'Passed (No revisions needed)',
                'Passed (With revisions needed)',
                'Pass with revision',
            ], true)
        ) {
            return 'Defended';
        }

        if (in_array($conceptVerdict, ['Conditional Passed', 'Conditional Pass'], true)) {
            return 'Conditional';
        }

        if (in_array($conceptVerdict, ['Failed', 'Deffered'], true)) {
            return 'Failed';
        }

        return null;
    }

    private function resolveProgramSetName(Group $group): string
    {
        $programSetName = is_string($group->programSet?->name) ? trim($group->programSet->name) : '';
        if ($programSetName !== '') {
            return $programSetName;
        }

        $program = is_string($group->programSet?->program) ? trim($group->programSet->program) : '';
        $schoolYear = is_string($group->programSet?->school_year) ? trim($group->programSet->school_year) : '';
        $fallback = trim($program.' '.$schoolYear);

        return $fallback !== '' ? $fallback : 'Program set';
    }

    private function formatGroupName(string $name): string
    {
        $trimmed = trim($name);
        if ($trimmed === '') {
            return 'Group';
        }

        return str_ends_with(strtolower($trimmed), ' group') ? $trimmed : $trimmed.' Group';
    }

    /**
     * @return array<int, array{id: int|null, name: string|null, role: string, email: string|null}>
     */
    private function resolveGroupMembers(Group $group): array
    {
        $members = collect();
        $leader = $group->leader;
        if ($leader instanceof User) {
            $members->push([
                'id' => $leader->id,
                'name' => $this->resolveUserName($leader),
                'role' => 'Leader',
                'email' => $leader->email,
            ]);
        }

        $members = $members->merge(
            $group->members
                ->map(function (User $member): array {
                    return [
                        'id' => $member->id,
                        'name' => $this->resolveUserName($member),
                        'role' => 'Member',
                        'email' => $member->email,
                    ];
                })
                ->values(),
        );

        return $members
            ->unique('id')
            ->values()
            ->all();
    }

    /**
     * @return array{id: int, name: string, email: string|null}|null
     */
    private function resolveAdviser(Group $group): ?array
    {
        $adviser = $group->adviserAssignment?->adviser;
        if (! $adviser instanceof User) {
            return null;
        }

        return [
            'id' => $adviser->id,
            'name' => $this->resolveUserName($adviser),
            'email' => $adviser->email,
        ];
    }

    /**
     * @return array<int, array{id: int|null, name: string|null, role: string, email: string|null}>
     */
    private function resolvePanelists(Group $group): array
    {
        return $group->panelAssignments
            ->sortBy('panel_slot')
            ->values()
            ->map(function (GroupPanelist $assignment): array {
                $panelist = $assignment->panelist;

                return [
                    'id' => $panelist?->id,
                    'name' => $panelist instanceof User ? $this->resolveUserName($panelist) : null,
                    'role' => $this->formatPanelRole($assignment->role),
                    'email' => $panelist?->email,
                ];
            })
            ->all();
    }

    private function formatPanelRole(?string $role): string
    {
        if ($role === 'chairman') {
            return 'Panel Chairman';
        }

        return 'Panel Member';
    }

    private function resolveUserName(?User $user): string
    {
        if (! $user instanceof User) {
            return 'Unassigned';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);
        if ($fullName !== '') {
            return $fullName;
        }

        $name = is_string($user->name) ? trim($user->name) : '';
        if ($name !== '') {
            return $name;
        }

        return $user->email ?? 'Unassigned';
    }
}
