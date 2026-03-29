<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Models\DefenseSchedule;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PanelistDashboardController extends Controller
{
    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const STAGE_VISUALS = [
        'Concept' => ['label' => 'Concept', 'color' => '#34d399'],
        'Outline' => ['label' => 'Outline', 'color' => '#10b981'],
        'Pre-Deployment' => ['label' => 'Pre-Deployment', 'color' => '#14b8a6'],
        'Deployment' => ['label' => 'Deployment', 'color' => '#0ea5a4'],
        'Final' => ['label' => 'Final', 'color' => '#047857'],
    ];

    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const SCHEDULE_STATUS_VISUALS = [
        'Scheduled' => ['label' => 'Scheduled', 'color' => '#10b981'],
        'Pending' => ['label' => 'Pending', 'color' => '#f59e0b'],
        'Completed' => ['label' => 'Completed', 'color' => '#047857'],
        'Cancelled' => ['label' => 'Cancelled', 'color' => '#dc2626'],
    ];

    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const DOCUMENT_STATUS_VISUALS = [
        'Submitted' => ['label' => 'Submitted', 'color' => '#10b981'],
        'Approved' => ['label' => 'Approved', 'color' => '#059669'],
        'Revision Required' => ['label' => 'Revision Required', 'color' => '#f97316'],
    ];

    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const PROGRAM_VISUALS = [
        'BSIT' => ['label' => 'BSIT', 'color' => '#10b981'],
        'BSIS' => ['label' => 'BSIS', 'color' => '#14b8a6'],
    ];

    public function __invoke(): Response
    {
        /** @var User|null $panelist */
        $panelist = Auth::guard('web')->user();
        $panelistId = $panelist?->id;
        $assignedGroupIds = $this->resolveAssignedGroupIds($panelistId);

        $scheduleStatusDistribution = $this->buildScheduleStatusDistribution($assignedGroupIds);
        $documentStatusDistribution = $this->buildDocumentStatusDistribution($assignedGroupIds);

        $scheduleStatusByLabel = collect($scheduleStatusDistribution)->keyBy('label');
        $documentStatusByLabel = collect($documentStatusDistribution)->keyBy('label');

        $assignedGroups = count($assignedGroupIds);
        $scheduledDefenses = $this->countUpcomingDefenses($assignedGroupIds);
        $pendingEvaluations = $this->countPendingEvaluations($assignedGroupIds);
        $completedDefenses = (int) ($scheduleStatusByLabel->get('Completed')['value'] ?? 0);
        $overdueDefenses = $this->countOverdueDefenses($assignedGroupIds);

        $submittedDocuments = (int) ($documentStatusByLabel->get('Submitted')['value'] ?? 0);
        $reviewedDocuments = (int) ($documentStatusByLabel->get('Approved')['value'] ?? 0);
        $revisionDocuments = (int) ($documentStatusByLabel->get('Revision Required')['value'] ?? 0);

        $programDistribution = $this->buildProgramDistribution($assignedGroupIds);

        return Inertia::render('Panelist/dashboard', [
            'welcomeName' => $this->resolveDisplayName($panelist),
            'stats' => [
                'assignedGroups' => $assignedGroups,
                'scheduledDefenses' => $scheduledDefenses,
                'pendingEvaluations' => $pendingEvaluations,
                'completedDefenses' => $completedDefenses,
                'overdueDefenses' => $overdueDefenses,
                'submittedDocuments' => $submittedDocuments,
                'reviewedDocuments' => $reviewedDocuments,
                'revisionDocuments' => $revisionDocuments,
                'uniquePrograms' => collect($programDistribution)
                    ->filter(fn (array $item): bool => $item['value'] > 0)
                    ->count(),
            ],
            'stageDistribution' => $this->buildStageDistribution($assignedGroupIds),
            'scheduleStatusDistribution' => $scheduleStatusDistribution,
            'documentStatusDistribution' => $documentStatusDistribution,
            'programDistribution' => $programDistribution,
            'upcomingScheduleLoad' => $this->buildUpcomingScheduleLoad($assignedGroupIds),
            'upcomingSchedules' => $this->buildUpcomingSchedules($assignedGroupIds),
            'recentDocumentActivity' => $this->buildRecentDocumentActivity($assignedGroupIds),
        ]);
    }

    /**
     * @return array<int>
     */
    private function resolveAssignedGroupIds(?int $panelistId): array
    {
        if ($panelistId === null || ! Schema::hasTable('group_panelists')) {
            return [];
        }

        return GroupPanelist::query()
            ->where('panelist_id', $panelistId)
            ->pluck('group_id')
            ->map(fn ($id): int => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function countUpcomingDefenses(array $groupIds): int
    {
        if (count($groupIds) === 0 || ! Schema::hasTable('defense_schedules')) {
            return 0;
        }

        return DefenseSchedule::query()
            ->whereIn('group_id', $groupIds)
            ->whereIn('status', ['Scheduled', 'Pending'])
            ->whereDate('scheduled_date', '>=', now()->toDateString())
            ->count();
    }

    private function countPendingEvaluations(array $groupIds): int
    {
        if (count($groupIds) === 0 || ! Schema::hasTable('defense_schedules')) {
            return 0;
        }

        return DefenseSchedule::query()
            ->whereIn('group_id', $groupIds)
            ->whereIn('status', ['Scheduled', 'Pending'])
            ->count();
    }

    private function countOverdueDefenses(array $groupIds): int
    {
        if (count($groupIds) === 0 || ! Schema::hasTable('defense_schedules')) {
            return 0;
        }

        return DefenseSchedule::query()
            ->whereIn('group_id', $groupIds)
            ->whereIn('status', ['Scheduled', 'Pending'])
            ->whereDate('scheduled_date', '<', now()->toDateString())
            ->count();
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildStageDistribution(array $groupIds): array
    {
        $stageCounts = collect(array_fill_keys(array_keys(self::STAGE_VISUALS), 0));
        $otherStageCount = 0;

        if (count($groupIds) > 0 && Schema::hasTable('defense_schedules')) {
            $counts = DefenseSchedule::query()
                ->whereIn('group_id', $groupIds)
                ->selectRaw('stage, COUNT(*) as total')
                ->groupBy('stage')
                ->pluck('total', 'stage');

            foreach ($counts as $stage => $total) {
                $normalizedStage = trim((string) $stage);
                $count = (int) $total;

                if ($normalizedStage === '') {
                    continue;
                }

                if ($stageCounts->has($normalizedStage)) {
                    $stageCounts[$normalizedStage] = $count;

                    continue;
                }

                $otherStageCount += $count;
            }
        }

        $distribution = collect(self::STAGE_VISUALS)
            ->map(function (array $visual, string $stage) use ($stageCounts): array {
                return [
                    'label' => $visual['label'],
                    'value' => (int) ($stageCounts->get($stage, 0)),
                    'color' => $visual['color'],
                ];
            })
            ->values();

        if ($otherStageCount > 0) {
            $distribution->push([
                'label' => 'Other',
                'value' => $otherStageCount,
                'color' => '#94a3b8',
            ]);
        }

        return $distribution->all();
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildScheduleStatusDistribution(array $groupIds): array
    {
        $statusCounts = collect(array_fill_keys(array_keys(self::SCHEDULE_STATUS_VISUALS), 0));

        if (count($groupIds) > 0 && Schema::hasTable('defense_schedules')) {
            $counts = DefenseSchedule::query()
                ->whereIn('group_id', $groupIds)
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            foreach ($statusCounts->keys() as $status) {
                $statusCounts[$status] = (int) ($counts->get($status, 0));
            }
        }

        return collect(self::SCHEDULE_STATUS_VISUALS)
            ->map(function (array $visual, string $status) use ($statusCounts): array {
                return [
                    'label' => $visual['label'],
                    'value' => (int) ($statusCounts->get($status, 0)),
                    'color' => $visual['color'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildDocumentStatusDistribution(array $groupIds): array
    {
        $statusCounts = collect(array_fill_keys(array_keys(self::DOCUMENT_STATUS_VISUALS), 0));

        if (count($groupIds) > 0 && Schema::hasTable('document_submissions')) {
            $counts = DocumentSubmission::query()
                ->whereIn('group_id', $groupIds)
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            foreach ($statusCounts->keys() as $status) {
                $statusCounts[$status] = (int) ($counts->get($status, 0));
            }
        }

        return collect(self::DOCUMENT_STATUS_VISUALS)
            ->map(function (array $visual, string $status) use ($statusCounts): array {
                return [
                    'label' => $visual['label'],
                    'value' => (int) ($statusCounts->get($status, 0)),
                    'color' => $visual['color'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildProgramDistribution(array $groupIds): array
    {
        $programCounts = collect(array_fill_keys(array_keys(self::PROGRAM_VISUALS), 0));
        $otherProgramCount = 0;

        if (count($groupIds) > 0 && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $groups = Group::query()
                ->with('programSet:id,program')
                ->whereIn('id', $groupIds)
                ->get(['id', 'program_set_id']);

            foreach ($groups as $group) {
                $program = strtoupper(trim((string) $group->programSet?->program));
                if ($program === '') {
                    continue;
                }

                if ($programCounts->has($program)) {
                    $programCounts[$program] = (int) ($programCounts->get($program, 0) + 1);

                    continue;
                }

                $otherProgramCount++;
            }
        }

        $distribution = collect(self::PROGRAM_VISUALS)
            ->map(function (array $visual, string $program) use ($programCounts): array {
                return [
                    'label' => $visual['label'],
                    'value' => (int) ($programCounts->get($program, 0)),
                    'color' => $visual['color'],
                ];
            })
            ->values();

        if ($otherProgramCount > 0) {
            $distribution->push([
                'label' => 'Other',
                'value' => $otherProgramCount,
                'color' => '#64748b',
            ]);
        }

        return $distribution->all();
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    private function buildUpcomingScheduleLoad(array $groupIds): array
    {
        $dayStarts = collect(range(0, 6))
            ->map(static fn (int $offset): CarbonInterface => now()->startOfDay()->addDays($offset));

        $dayLabels = $dayStarts
            ->map(static fn (CarbonInterface $day): string => $day->format('M d'))
            ->values()
            ->all();

        $countByDate = collect();
        if (count($groupIds) > 0 && Schema::hasTable('defense_schedules')) {
            $countByDate = DefenseSchedule::query()
                ->whereIn('group_id', $groupIds)
                ->whereIn('status', ['Scheduled', 'Pending'])
                ->whereDate('scheduled_date', '>=', $dayStarts->first()?->toDateString())
                ->whereDate('scheduled_date', '<=', $dayStarts->last()?->toDateString())
                ->selectRaw('scheduled_date, COUNT(*) as total')
                ->groupBy('scheduled_date')
                ->pluck('total', 'scheduled_date');
        }

        $values = $dayStarts
            ->map(function (CarbonInterface $day) use ($countByDate): int {
                return (int) ($countByDate->get($day->toDateString(), 0));
            })
            ->values()
            ->all();

        return [
            'labels' => $dayLabels,
            'values' => $values,
        ];
    }

    /**
     * @return array<int, array{id: int, groupName: string, stage: string, scheduledDate: string|null, startTime: string|null, roomName: string|null, status: string}>
     */
    private function buildUpcomingSchedules(array $groupIds): array
    {
        if (count($groupIds) === 0 || ! Schema::hasTable('defense_schedules')) {
            return [];
        }

        $query = DefenseSchedule::query()
            ->whereIn('group_id', $groupIds)
            ->whereDate('scheduled_date', '>=', now()->toDateString())
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->limit(6);

        if (Schema::hasTable('groups')) {
            $query->with('group:id,name');
        }

        if (Schema::hasTable('defense_rooms')) {
            $query->with('room:id,name');
        }

        return $query
            ->get(['id', 'group_id', 'room_id', 'scheduled_date', 'start_time', 'stage', 'status'])
            ->map(function (DefenseSchedule $schedule): array {
                return [
                    'id' => $schedule->id,
                    'groupName' => is_string($schedule->group?->name) && trim($schedule->group->name) !== ''
                        ? (string) $schedule->group->name
                        : 'Unassigned Group',
                    'stage' => is_string($schedule->stage) && trim($schedule->stage) !== '' ? $schedule->stage : 'Defense',
                    'scheduledDate' => $schedule->scheduled_date?->format('Y-m-d'),
                    'startTime' => $this->formatTime($schedule->start_time),
                    'roomName' => is_string($schedule->room?->name) && trim($schedule->room->name) !== ''
                        ? (string) $schedule->room->name
                        : null,
                    'status' => is_string($schedule->status) && trim($schedule->status) !== '' ? $schedule->status : 'Scheduled',
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, groupName: string, requirementType: string, stage: string|null, fileName: string, status: string, updatedAt: string}>
     */
    private function buildRecentDocumentActivity(array $groupIds): array
    {
        if (count($groupIds) === 0 || ! Schema::hasTable('document_submissions')) {
            return [];
        }

        $query = DocumentSubmission::query()
            ->whereIn('group_id', $groupIds)
            ->orderByDesc('updated_at')
            ->limit(6);

        if (Schema::hasTable('groups')) {
            $query->with('group:id,name');
        }

        if (Schema::hasTable('document_requirements')) {
            $query->with('requirement:id,requirement_type,stage');
        }

        return $query
            ->get(['id', 'group_id', 'document_requirement_id', 'file_name', 'status', 'updated_at'])
            ->map(function (DocumentSubmission $submission): array {
                $requirementType = is_string($submission->requirement?->requirement_type) && trim($submission->requirement->requirement_type) !== ''
                    ? (string) $submission->requirement->requirement_type
                    : 'Document';

                return [
                    'id' => $submission->id,
                    'groupName' => is_string($submission->group?->name) && trim($submission->group->name) !== ''
                        ? (string) $submission->group->name
                        : 'Unassigned Group',
                    'requirementType' => $requirementType,
                    'stage' => is_string($submission->requirement?->stage) && trim($submission->requirement->stage) !== ''
                        ? $submission->requirement->stage
                        : null,
                    'fileName' => (string) $submission->file_name,
                    'status' => is_string($submission->status) && trim($submission->status) !== ''
                        ? $submission->status
                        : 'Submitted',
                    'updatedAt' => $submission->updated_at?->format('Y-m-d H:i:s') ?? '',
                ];
            })
            ->values()
            ->all();
    }

    private function resolveDisplayName(?User $user): string
    {
        if ($user === null) {
            return 'Panelist';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        if ($firstName !== '' || $lastName !== '') {
            return trim($firstName.' '.$lastName);
        }

        if (is_string($user->name) && trim($user->name) !== '') {
            return $user->name;
        }

        return 'Panelist';
    }

    private function formatTime(?string $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $time = Carbon::createFromFormat('H:i:s', $value);
        if ($time === false) {
            return $value;
        }

        return $time->format('g:i A');
    }
}
