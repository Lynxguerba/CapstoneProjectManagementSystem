<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\AssignGroupAdviserController;
use App\Http\Controllers\AssignGroupPanelistController;
use App\Http\Controllers\BulkEnrollStudentsController;
use App\Http\Controllers\DestroyDefenseRoomController;
use App\Http\Controllers\DestroyDocumentRequirementController;
use App\Http\Controllers\DestroyGroupController;
use App\Http\Controllers\DownloadDocumentSubmissionController;
use App\Http\Controllers\EnrollStudentController;
use App\Http\Controllers\Instructor\ApproveCrossSetGroupRequestController;
use App\Http\Controllers\Instructor\CrossSetStudentSearchController;
use App\Http\Controllers\Instructor\RejectCrossSetGroupRequestController;
use App\Http\Controllers\Instructor\StoreCrossSetGroupRequestController;
use App\Http\Controllers\StoreDefenseRoomController;
use App\Http\Controllers\StoreDocumentRequirementController;
use App\Http\Controllers\UnenrollStudentController;
use App\Http\Controllers\UpdateDefenseRoomController;
use App\Http\Controllers\UpdateDefenseScheduleStatusController;
use App\Http\Controllers\UpdateDocumentRequirementController;
use App\Http\Controllers\UpdateDocumentSubmissionStatusController;
use App\Http\Controllers\UpdateGroupMembersController;
use App\Http\Controllers\UpdateProgramSetNameController;
use App\Http\Controllers\UpsertDefenseScheduleController;
use App\Models\AcademicYear;
use App\Models\AdviserAvailability;
use App\Models\AdviserProgramUtility;
use App\Models\CrossSetGroupRequest;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAdviserRequest;
use App\Models\PanelistAvailability;
use App\Models\PanelistProgramUtility;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::middleware(['auth', 'role:instructor'])->prefix('instructor')->group(function () {
    Route::get('/dashboard', function () {
        $userId = Auth::guard('web')->id();
        $selectedAcademicYear = request()->query('academic_year');
        $selectedAcademicYear = is_string($selectedAcademicYear) && $selectedAcademicYear !== '' ? $selectedAcademicYear : null;
        $hasProgramSetsSchoolYearColumn = Schema::hasTable('program_sets') && Schema::hasColumn('program_sets', 'school_year');
        $pendingRequestsByGroup = collect();
        $pendingRequestsByGroup = collect();
        $programSetIds = [];
        $programSetsCount = 0;
        $programSetSummaries = [];
        $statusRecordsByYear = [];
        $programDistribution = [];
        $groupIds = [];
        $groupsCount = 0;
        $studentsCount = 0;
        $groupedStudentsCount = 0;
        $adviserAssignedCount = 0;
        $adviserUnassignedCount = 0;
        $panelSlotsFilled = 0;
        $panelSlotsTotal = 0;
        $panelSlotsOpen = 0;
        $panelGroupsNeeding = 0;
        $scheduledGroups = 0;
        $upcomingDefenses = 0;
        $roomsTotal = 0;
        $roomsActive = 0;
        $statusBuckets = [
            'Scheduled' => 0,
            'Pending' => 0,
            'Completed' => 0,
            'Cancelled' => 0,
            'Unscheduled' => 0,
        ];
        $stageBuckets = [
            'Concept' => 0,
            'Outline' => 0,
            'Pre-Deployment' => 0,
            'Deployment' => 0,
            'Final' => 0,
        ];
        $latestSchedulesByGroup = collect();
        $panelCountsByGroup = collect();
        $groups = [];
        $upcomingSchedules = [];
        $attentionItems = [];
        $panelists = [];

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        $resolveInitials = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $initials = '';

            if ($firstName !== '') {
                $initials .= substr($firstName, 0, 1);
            }

            if ($lastName !== '') {
                $initials .= substr($lastName, 0, 1);
            }

            if ($initials === '') {
                $name = is_string($user->name) ? trim($user->name) : '';
                $parts = $name !== '' ? preg_split('/\s+/', $name) : [];
                $parts = is_array($parts) ? $parts : [];

                if (count($parts) > 0) {
                    $initials = substr($parts[0], 0, 1);
                }

                if (count($parts) > 1) {
                    $initials .= substr($parts[1], 0, 1);
                }
            }

            return strtoupper($initials);
        };

        try {
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $programSetIds = ProgramSet::query()
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->when(
                        $selectedAcademicYear !== null && $selectedAcademicYear !== 'All',
                        function ($query) use ($selectedAcademicYear, $hasProgramSetsSchoolYearColumn): void {
                            $query->where(function ($subQuery) use ($selectedAcademicYear, $hasProgramSetsSchoolYearColumn): void {
                                $subQuery->whereHas('academicYear', fn ($academicYearQuery) => $academicYearQuery->where('label', $selectedAcademicYear));

                                if ($hasProgramSetsSchoolYearColumn) {
                                    $subQuery->orWhere('school_year', $selectedAcademicYear);
                                }
                            });
                        }
                    )
                    ->pluck('id')
                    ->all();
                $programSetsCount = count($programSetIds);
            }
        } catch (\Throwable $e) {
            $programSetIds = [];
            $programSetsCount = 0;
        }

        try {
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets') && count($programSetIds) > 0) {
                $hasGroupsTable = Schema::hasTable('groups');
                $hasProgramSetStudentTable = Schema::hasTable('program_set_student');

                $programSetsQuery = ProgramSet::query()
                    ->with(['academicYear'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->when($hasProgramSetStudentTable, fn ($query) => $query->withCount('students'))
                    ->when($hasGroupsTable, fn ($query) => $query->withCount('groups'))
                    ->orderByDesc('created_at')
                    ->get(['id', 'name', 'program', 'academic_year_id', 'instructor_id']);

                $programSetSummaries = $programSetsQuery
                    ->map(fn (ProgramSet $programSet): array => [
                        'id' => $programSet->id,
                        'name' => $programSet->name,
                        'program' => $programSet->program,
                        'school_year' => $programSet->academicYear?->label,
                        'students_count' => $hasProgramSetStudentTable ? ($programSet->students_count ?? 0) : 0,
                        'groups_count' => $hasGroupsTable ? ($programSet->groups_count ?? 0) : 0,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $programSetSummaries = [];
        }

        $programDistributionCounts = [
            'BSIS' => 0,
            'BSIT' => 0,
        ];

        try {
            if (
                Schema::hasTable('users')
                && Schema::hasTable('program_sets')
                && Schema::hasTable('program_set_student')
                && count($programSetIds) > 0
            ) {
                foreach (array_keys($programDistributionCounts) as $program) {
                    $programDistributionCounts[$program] = User::query()
                        ->whereHas('programSets', function (Builder $query) use ($programSetIds, $program): void {
                            $query->whereIn('program_sets.id', $programSetIds)
                                ->where('program_sets.program', $program);
                        })
                        ->count();
                }
            }
        } catch (\Throwable $e) {
            $programDistributionCounts = [
                'BSIS' => 0,
                'BSIT' => 0,
            ];
        }

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups') && count($programSetIds) > 0) {
                $groupIds = \App\Models\Group::query()
                    ->whereIn('program_set_id', $programSetIds)
                    ->pluck('id')
                    ->all();
                $groupsCount = count($groupIds);
            }
        } catch (\Throwable $e) {
            $groupIds = [];
            $groupsCount = 0;
        }

        try {
            if (Schema::hasTable('program_set_student') && count($programSetIds) > 0) {
                $studentsCount = User::query()
                    ->whereHas('programSets', fn ($query) => $query->whereIn('program_sets.id', $programSetIds))
                    ->count();
            }
        } catch (\Throwable $e) {
            $studentsCount = 0;
        }

        try {
            if (Schema::hasTable('group_members') && count($groupIds) > 0) {
                $groupedStudentsCount = \App\Models\GroupMember::query()
                    ->whereIn('group_id', $groupIds)
                    ->distinct('student_id')
                    ->count('student_id');
            }
        } catch (\Throwable $e) {
            $groupedStudentsCount = 0;
        }

        try {
            if (Schema::hasTable('group_advisers') && count($groupIds) > 0) {
                $adviserAssignedCount = \App\Models\GroupAdviser::query()
                    ->whereIn('group_id', $groupIds)
                    ->distinct('group_id')
                    ->count('group_id');
            }
        } catch (\Throwable $e) {
            $adviserAssignedCount = 0;
        }

        $adviserUnassignedCount = max(0, $groupsCount - $adviserAssignedCount);

        try {
            if (Schema::hasTable('group_panelists') && count($groupIds) > 0) {
                $panelAssignments = \App\Models\GroupPanelist::query()
                    ->whereIn('group_id', $groupIds)
                    ->get(['group_id']);

                $panelSlotsFilled = $panelAssignments->count();
                $panelCountsByGroup = $panelAssignments->countBy('group_id');
                $groupsWithFullPanel = $panelCountsByGroup->filter(fn (int $count): bool => $count >= 3)->count();
                $panelGroupsNeeding = max(0, $groupsCount - $groupsWithFullPanel);
            }
        } catch (\Throwable $e) {
            $panelSlotsFilled = 0;
            $panelCountsByGroup = collect();
            $panelGroupsNeeding = 0;
        }

        $panelSlotsTotal = $groupsCount * 3;
        $panelSlotsOpen = max(0, $panelSlotsTotal - $panelSlotsFilled);

        try {
            if (
                Schema::hasTable('users')
                && Schema::hasTable('groups')
                && Schema::hasTable('group_panelists')
                && count($groupIds) > 0
            ) {
                $hasRoleTables = Schema::hasTable('roles') && Schema::hasTable('role_user');
                $panelistsQuery = User::query()
                    ->when($hasRoleTables, function ($query) {
                        $query->where(function ($roleQuery) {
                            $roleQuery->where('role', 'like', '%panelist%')
                                ->orWhereHas('roles', fn ($subQuery) => $subQuery->where('slug', 'panelist'));
                        });
                    }, function ($query) {
                        $query->where('role', 'like', '%panelist%');
                    })
                    ->whereHas('panelGroups', fn ($query) => $query->whereIn('groups.id', $groupIds))
                    ->withCount(['panelGroups as groups_count' => fn ($query) => $query->whereIn('groups.id', $groupIds)])
                    ->orderByDesc('groups_count')
                    ->orderBy('last_name')
                    ->limit(4)
                    ->get(['id', 'name', 'first_name', 'last_name', 'email']);

                $panelists = $panelistsQuery
                    ->map(function (User $panelist): array {
                        $firstName = is_string($panelist->first_name) ? trim($panelist->first_name) : '';
                        $lastName = is_string($panelist->last_name) ? trim($panelist->last_name) : '';
                        $fullName = $firstName !== '' || $lastName !== ''
                            ? trim($firstName.' '.$lastName)
                            : (is_string($panelist->name) ? $panelist->name : '');

                        return [
                            'id' => $panelist->id,
                            'name' => $fullName,
                            'email' => $panelist->email ?? null,
                            'groups_count' => (int) ($panelist->groups_count ?? 0),
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $panelists = [];
        }

        try {
            if (class_exists(\App\Models\DefenseRoom::class) && Schema::hasTable('defense_rooms')) {
                $roomsTotal = \App\Models\DefenseRoom::query()->count();
                $roomsActive = \App\Models\DefenseRoom::query()->where('is_active', true)->count();
            }
        } catch (\Throwable $e) {
            $roomsTotal = 0;
            $roomsActive = 0;
        }

        $statusBuckets['Unscheduled'] = $groupsCount;

        try {
            if (class_exists(\App\Models\DefenseSchedule::class) && Schema::hasTable('defense_schedules') && count($groupIds) > 0) {
                $latestSchedulesByGroup = \App\Models\DefenseSchedule::query()
                    ->whereIn('group_id', $groupIds)
                    ->orderByDesc('scheduled_date')
                    ->orderByDesc('start_time')
                    ->get(['id', 'group_id', 'status', 'stage', 'scheduled_date', 'start_time', 'end_time', 'room_id'])
                    ->groupBy('group_id')
                    ->map(fn ($schedules) => $schedules->first());

                $scheduledGroups = $latestSchedulesByGroup->count();
                $statusBuckets = [
                    'Scheduled' => 0,
                    'Pending' => 0,
                    'Completed' => 0,
                    'Cancelled' => 0,
                    'Unscheduled' => 0,
                ];

                foreach ($groupIds as $groupId) {
                    $schedule = $latestSchedulesByGroup->get($groupId);
                    $status = is_string($schedule?->status) && $schedule?->status !== '' ? $schedule->status : 'Unscheduled';
                    $statusBuckets[$status] = ($statusBuckets[$status] ?? 0) + 1;
                }

                foreach ($latestSchedulesByGroup as $schedule) {
                    $stage = $schedule?->stage;
                    if (is_string($stage) && array_key_exists($stage, $stageBuckets)) {
                        $stageBuckets[$stage] += 1;
                    }
                }

                $today = now()->toDateString();

                $upcomingDefenses = \App\Models\DefenseSchedule::query()
                    ->whereIn('group_id', $groupIds)
                    ->whereIn('status', ['Scheduled', 'Pending'])
                    ->whereDate('scheduled_date', '>=', $today)
                    ->count();

                $upcomingSchedules = \App\Models\DefenseSchedule::query()
                    ->with(['group', 'room'])
                    ->whereIn('group_id', $groupIds)
                    ->whereIn('status', ['Scheduled', 'Pending'])
                    ->whereDate('scheduled_date', '>=', $today)
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->limit(5)
                    ->get()
                    ->map(function (\App\Models\DefenseSchedule $schedule): array {
                        return [
                            'id' => $schedule->id,
                            'group_name' => $schedule->group?->name,
                            'stage' => $schedule->stage,
                            'status' => $schedule->status,
                            'scheduled_date' => $schedule->scheduled_date?->format('Y-m-d'),
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'room_name' => $schedule->room?->name,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $latestSchedulesByGroup = collect();
            $scheduledGroups = 0;
            $statusBuckets = [
                'Scheduled' => 0,
                'Pending' => 0,
                'Completed' => 0,
                'Cancelled' => 0,
                'Unscheduled' => $groupsCount,
            ];
            $stageBuckets = [
                'Concept' => 0,
                'Outline' => 0,
                'Pre-Deployment' => 0,
                'Deployment' => 0,
                'Final' => 0,
            ];
            $upcomingDefenses = 0;
            $upcomingSchedules = [];
        }

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups') && count($programSetIds) > 0) {
                $groups = \App\Models\Group::query()
                    ->with([
                        'members' => function ($query) {
                            $query->orderBy('last_name')->orderBy('first_name')->limit(4);
                        },
                        'adviserAssignment.adviser',
                    ])
                    ->withCount('members')
                    ->whereIn('program_set_id', $programSetIds)
                    ->orderByDesc('created_at')
                    ->limit(6)
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName, $resolveInitials, $latestSchedulesByGroup, $panelCountsByGroup): array {
                        $members = $group->members
                            ->map(function (User $member) use ($resolveUserName, $resolveInitials): array {
                                $name = $resolveUserName($member);
                                $initials = $resolveInitials($member);

                                return [
                                    'name' => $name,
                                    'initials' => $initials,
                                ];
                            })
                            ->values()
                            ->all();

                        $schedule = $latestSchedulesByGroup->get($group->id);
                        $status = is_string($schedule?->status) && $schedule?->status !== '' ? $schedule->status : 'Unscheduled';
                        $stage = is_string($schedule?->stage) ? $schedule->stage : null;
                        $progress = match ($stage) {
                            'Concept' => 20,
                            'Outline' => 40,
                            'Pre-Deployment' => 60,
                            'Deployment' => 80,
                            'Final' => 100,
                            default => 0,
                        };
                        $panelCount = (int) ($panelCountsByGroup->get($group->id) ?? 0);
                        $panelSlotsOpen = max(0, 3 - $panelCount);
                        $adviserName = $resolveUserName($group->adviserAssignment?->adviser);

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'members' => $members,
                            'members_count' => $group->members_count ?? 0,
                            'adviser_name' => $adviserName !== '' ? $adviserName : null,
                            'status' => $status,
                            'stage' => $stage,
                            'progress' => $progress,
                            'panel_slots_open' => $panelSlotsOpen,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups') && count($programSetIds) > 0) {
                $attentionItems = \App\Models\Group::query()
                    ->with(['adviserAssignment'])
                    ->whereIn('program_set_id', $programSetIds)
                    ->orderByDesc('created_at')
                    ->get(['id', 'name'])
                    ->map(function (\App\Models\Group $group) use ($latestSchedulesByGroup, $panelCountsByGroup): ?array {
                        $issues = [];
                        $schedule = $latestSchedulesByGroup->get($group->id);
                        $panelCount = (int) ($panelCountsByGroup->get($group->id) ?? 0);
                        $panelSlotsOpen = max(0, 3 - $panelCount);

                        if ($group->adviserAssignment === null) {
                            $issues[] = 'Adviser unassigned';
                        }

                        if ($panelSlotsOpen > 0) {
                            $issues[] = $panelSlotsOpen.' panel slot'.($panelSlotsOpen > 1 ? 's' : '').' open';
                        }

                        if ($schedule === null) {
                            $issues[] = 'No defense schedule';
                        }

                        if (count($issues) === 0) {
                            return null;
                        }

                        $tone = 'info';
                        if ($group->adviserAssignment === null || $schedule === null) {
                            $tone = 'danger';
                        } elseif ($panelSlotsOpen > 0) {
                            $tone = 'warning';
                        }

                        return [
                            'id' => $group->id,
                            'group_name' => $group->name,
                            'issue' => implode(' • ', $issues),
                            'tone' => $tone,
                        ];
                    })
                    ->filter()
                    ->take(6)
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $attentionItems = [];
        }

        $statusColors = [
            'Scheduled' => '#10b981',
            'Pending' => '#f59e0b',
            'Completed' => '#22c55e',
            'Cancelled' => '#f43f5e',
            'Unscheduled' => '#94a3b8',
        ];

        $statusRecords = collect($statusBuckets)
            ->map(function (int $value, string $label) use ($statusColors): array {
                return [
                    'label' => $label,
                    'value' => $value,
                    'color' => $statusColors[$label] ?? '#94a3b8',
                ];
            })
            ->values()
            ->all();

        $programColors = [
            'BSIT' => '#10b981',
            'BSIS' => '#22c55e',
        ];

        $programDistribution = collect($programDistributionCounts)
            ->map(function (int $value, string $label) use ($programColors): array {
                return [
                    'label' => $label,
                    'value' => $value,
                    'color' => $programColors[$label] ?? '#94a3b8',
                ];
            })
            ->values()
            ->all();

        try {
            if (
                class_exists(\App\Models\Group::class)
                && Schema::hasTable('groups')
                && Schema::hasTable('program_sets')
                && count($groupIds) > 0
            ) {
                $groupsByYear = \App\Models\Group::query()
                    ->with(['programSet.academicYear'])
                    ->whereIn('id', $groupIds)
                    ->get(['id', 'program_set_id']);

                $statusBucketsByYear = [];
                $yearMeta = [];

                foreach ($groupsByYear as $group) {
                    $programSet = $group->programSet;
                    $yearLabel = $programSet?->academicYear?->label ?? '';

                    if ($yearLabel === '') {
                        $yearLabel = 'Unspecified';
                    }

                    if (! array_key_exists($yearLabel, $statusBucketsByYear)) {
                        $statusBucketsByYear[$yearLabel] = [
                            'Scheduled' => 0,
                            'Pending' => 0,
                            'Completed' => 0,
                            'Cancelled' => 0,
                            'Unscheduled' => 0,
                        ];
                        $yearMeta[$yearLabel] = [
                            'academic_year_id' => $programSet?->academic_year_id,
                            'is_current' => $programSet?->academicYear?->is_current ?? false,
                        ];
                    }

                    $schedule = $latestSchedulesByGroup->get($group->id);
                    $status = is_string($schedule?->status) && $schedule?->status !== '' ? $schedule->status : 'Unscheduled';
                    $statusBucketsByYear[$yearLabel][$status] = ($statusBucketsByYear[$yearLabel][$status] ?? 0) + 1;
                }

                $statusRecordsByYear = collect($statusBucketsByYear)
                    ->map(function (array $buckets, string $label) use ($statusColors, $yearMeta): array {
                        $meta = $yearMeta[$label] ?? ['academic_year_id' => null, 'is_current' => false];

                        return [
                            'label' => $label,
                            'academic_year_id' => $meta['academic_year_id'],
                            'is_current' => $meta['is_current'],
                            'records' => collect($buckets)
                                ->map(function (int $value, string $statusLabel) use ($statusColors): array {
                                    return [
                                        'label' => $statusLabel,
                                        'value' => $value,
                                        'color' => $statusColors[$statusLabel] ?? '#94a3b8',
                                    ];
                                })
                                ->values()
                                ->all(),
                        ];
                    })
                    ->sortByDesc(fn (array $record): int => (int) ($record['academic_year_id'] ?? 0))
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $statusRecordsByYear = [];
        }

        $stageScale = collect($stageBuckets)
            ->map(function (int $value, string $label) use ($groupsCount): array {
                return [
                    'label' => $label,
                    'completed' => $value,
                    'total' => $groupsCount,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Instructor/dashboard', [
            'stats' => [
                'totalGroups' => $groupsCount,
                'programSets' => $programSetsCount,
                'students' => $studentsCount,
                'groupedStudents' => $groupedStudentsCount,
                'adviserAssigned' => $adviserAssignedCount,
                'adviserUnassigned' => $adviserUnassignedCount,
                'panelSlotsFilled' => $panelSlotsFilled,
                'panelSlotsTotal' => $panelSlotsTotal,
                'panelSlotsOpen' => $panelSlotsOpen,
                'panelGroupsNeeding' => $panelGroupsNeeding,
                'scheduledGroups' => $scheduledGroups,
                'upcomingDefenses' => $upcomingDefenses,
                'roomsTotal' => $roomsTotal,
                'roomsActive' => $roomsActive,
            ],
            'statusRecords' => $statusRecords,
            'statusRecordsByYear' => $statusRecordsByYear,
            'stageScale' => $stageScale,
            'programSets' => $programSetSummaries,
            'programDistribution' => $programDistribution,
            'groups' => $groups,
            'upcomingSchedules' => $upcomingSchedules,
            'attentionItems' => $attentionItems,
            'panelists' => $panelists,
            'selectedAcademicYear' => $selectedAcademicYear,
        ]);
    })->name('instructor.dashboard');
    Route::get('/groups', function () {
        $selectedAcademicYearId = request()->query('academic_year_id');
        $selectedAcademicYearId = is_numeric($selectedAcademicYearId) ? (int) $selectedAcademicYearId : null;
        $selectedAcademicYearId = $selectedAcademicYearId !== null && $selectedAcademicYearId > 0 ? $selectedAcademicYearId : null;
        $selectedAcademicYear = request()->query('academic_year');
        $selectedAcademicYear = is_string($selectedAcademicYear) && $selectedAcademicYear !== '' ? $selectedAcademicYear : null;
        $normalizedSelectedAcademicYear = is_string($selectedAcademicYear)
            ? trim((string) preg_replace('/^A\.?Y\.?\s*/i', '', $selectedAcademicYear))
            : null;
        $academicYearCandidates = collect([$selectedAcademicYear, $normalizedSelectedAcademicYear])
            ->filter(fn ($value): bool => is_string($value) && $value !== '')
            ->unique()
            ->values()
            ->all();
        $hasProgramSetsSchoolYearColumn = Schema::hasTable('program_sets') && Schema::hasColumn('program_sets', 'school_year');
        $programSets = [];

        try {
            $userId = Auth::guard('web')->id();
            if (class_exists(\App\Models\ProgramSet::class) && Schema::hasTable('program_sets')) {
                $hasProgramSetStudentTable = Schema::hasTable('program_set_student');
                $hasGroupsTable = Schema::hasTable('groups');
                $hasGroupMembersTable = Schema::hasTable('group_members');
                $hasGroupMembersIsCrossSetColumn = $hasGroupMembersTable && Schema::hasColumn('group_members', 'is_cross_set');
                $programSetColumns = ['id', 'name', 'program', 'academic_year_id', 'instructor_id'];

                if ($hasProgramSetsSchoolYearColumn) {
                    $programSetColumns[] = 'school_year';
                }

                $programSetsQuery = \App\Models\ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->when($selectedAcademicYearId !== null, fn ($query) => $query->where('academic_year_id', $selectedAcademicYearId))
                    ->when(
                        $selectedAcademicYearId === null && count($academicYearCandidates) > 0 && ! in_array('All', $academicYearCandidates, true),
                        function ($query) use ($academicYearCandidates, $hasProgramSetsSchoolYearColumn): void {
                            $query->where(function ($subQuery) use ($academicYearCandidates, $hasProgramSetsSchoolYearColumn): void {
                                $subQuery->whereHas('academicYear', fn ($academicYearQuery) => $academicYearQuery->whereIn('label', $academicYearCandidates));

                                if ($hasProgramSetsSchoolYearColumn) {
                                    $subQuery->orWhereIn('school_year', $academicYearCandidates);
                                }
                            });
                        }
                    )
                    ->when($hasProgramSetStudentTable, fn ($query) => $query->withCount('students'))
                    ->when($hasGroupsTable, fn ($query) => $query->withCount('groups'))
                    ->when(
                        $hasProgramSetStudentTable && $hasGroupsTable && $hasGroupMembersTable,
                        function ($query) use ($hasGroupMembersIsCrossSetColumn): void {
                            $query->selectSub(
                                DB::table('program_set_student as pss')
                                    ->join('group_members as gm', 'gm.student_id', '=', 'pss.student_id')
                                    ->join('groups as g', 'g.id', '=', 'gm.group_id')
                                    ->whereColumn('pss.program_set_id', 'program_sets.id')
                                    ->whereColumn('g.program_set_id', '!=', 'pss.program_set_id')
                                    ->when($hasGroupMembersIsCrossSetColumn, fn ($subQuery) => $subQuery->where('gm.is_cross_set', true))
                                    ->selectRaw('count(distinct g.id)'),
                                'cross_set_groups_count',
                            );
                        },
                    )
                    ->orderByDesc('created_at')
                    ->get($programSetColumns);

                $programSets = $programSetsQuery
                    ->map(function ($ps) use ($hasProgramSetStudentTable, $hasGroupsTable, $hasGroupMembersTable, $hasProgramSetsSchoolYearColumn): array {
                        $localGroupsCount = $hasGroupsTable ? (int) ($ps->groups_count ?? 0) : 0;
                        $crossSetGroupsCount = $hasProgramSetStudentTable && $hasGroupsTable && $hasGroupMembersTable
                            ? (int) ($ps->cross_set_groups_count ?? 0)
                            : 0;

                        return [
                            'id' => $ps->id,
                            'name' => $ps->name,
                            'program' => $ps->program,
                            'school_year' => $ps->academicYear?->label ?? ($hasProgramSetsSchoolYearColumn ? $ps->school_year : null),
                            'instructor_name' => $ps->instructor?->name,
                            'students_count' => $hasProgramSetStudentTable ? (int) ($ps->students_count ?? 0) : 0,
                            'groups_count' => $localGroupsCount + $crossSetGroupsCount,
                            'local_groups_count' => $localGroupsCount,
                            'cross_set_groups_count' => $crossSetGroupsCount,
                        ];
                    })
                    ->all();
            }
        } catch (\Throwable $e) {
            $programSets = [];
        }

        return Inertia::render('Instructor/groups', [
            'programSets' => $programSets,
            'selectedAcademicYear' => $selectedAcademicYear,
            'selectedAcademicYearId' => $selectedAcademicYearId,
        ]);
    })->name('instructor.groups');
    Route::get('/groups/{programSet}/manage', function (ProgramSet $programSet) {
        $userId = Auth::guard('web')->id();
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }

        $programSet->load('academicYear');
        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };
        $groups = [];

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['leader'])
                    ->where('program_set_id', $programSet->id)
                    ->withCount('members')
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $group->program_set_id,
                            'leader_name' => $resolveUserName($group->leader),
                            'members_count' => (int) ($group->members_count ?? 0),
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        $crossSetRequests = collect();

        try {
            if (class_exists(CrossSetGroupRequest::class) && Schema::hasTable('cross_set_group_requests')) {
                $studentColumns = ['id', 'first_name', 'last_name'];

                if (Schema::hasColumn('users', 'student_id_number')) {
                    $studentColumns[] = 'student_id_number';
                }

                $crossSetRequests = CrossSetGroupRequest::query()
                    ->with([
                        'student:'.implode(',', $studentColumns),
                        'group:id,name',
                        'requestedBy:id,first_name,last_name',
                    ])
                    ->where('requested_to', $userId)
                    ->where('status', 'pending')
                    ->latest()
                    ->get();
            }
        } catch (\Throwable $e) {
            $crossSetRequests = collect();
        }

        $crossSetMemberGroups = collect();

        try {
            if (Schema::hasTable('groups') && Schema::hasTable('group_members') && Schema::hasTable('program_set_student')) {
                $hasGroupMembersIsCrossSetColumn = Schema::hasColumn('group_members', 'is_cross_set');

                $crossSetMembershipRows = DB::table('group_members as gm')
                    ->join('groups as g', 'g.id', '=', 'gm.group_id')
                    ->join('program_set_student as pss', 'pss.student_id', '=', 'gm.student_id')
                    ->where('pss.program_set_id', $programSet->id)
                    ->where('g.program_set_id', '!=', $programSet->id)
                    ->when($hasGroupMembersIsCrossSetColumn, fn ($query) => $query->where('gm.is_cross_set', true))
                    ->select('gm.group_id', DB::raw('count(distinct gm.student_id) as cross_set_members_count'))
                    ->groupBy('gm.group_id')
                    ->get();

                $crossSetGroupIds = $crossSetMembershipRows
                    ->pluck('group_id')
                    ->map(fn ($groupId): int => (int) $groupId)
                    ->unique()
                    ->values();

                $crossSetGroupsById = Group::query()
                    ->with([
                        'leader:id,name,first_name,last_name',
                        'programSet:id,name,program,academic_year_id',
                        'programSet.academicYear:id,label',
                    ])
                    ->withCount('members')
                    ->whereIn('id', $crossSetGroupIds->all())
                    ->get()
                    ->keyBy('id');

                $crossSetMemberGroups = $crossSetMembershipRows
                    ->map(function ($row) use ($crossSetGroupsById, $resolveUserName): ?array {
                        $groupId = (int) $row->group_id;
                        $group = $crossSetGroupsById->get($groupId);
                        if (! $group) {
                            return null;
                        }

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'leader_name' => $resolveUserName($group->leader),
                            'members_count' => (int) ($group->members_count ?? 0),
                            'cross_set_members_count' => (int) ($row->cross_set_members_count ?? 0),
                            'program_set_name' => $group->programSet?->name,
                            'program' => $group->programSet?->program,
                            'school_year' => $group->programSet?->academicYear?->label,
                        ];
                    })
                    ->filter()
                    ->sortByDesc('cross_set_members_count')
                    ->values();
            }
        } catch (\Throwable $e) {
            $crossSetMemberGroups = collect();
        }

        return Inertia::render('Instructor/groups/managePage', [
            'programSet' => [
                'id' => $programSet->id,
                'name' => $programSet->name,
                'program' => $programSet->program,
                'school_year' => $programSet->academicYear?->label,
            ],
            'groups' => $groups,
            'crossSetRequests' => $crossSetRequests,
            'crossSetMemberGroups' => $crossSetMemberGroups,
        ]);
    })->name('instructor.groups.manage');
    Route::get('/groups/{group}/details', function (\App\Models\Group $group) {
        $userId = Auth::guard('web')->id();
        $hasGroupAdviserTable = Schema::hasTable('group_advisers');
        $hasGroupPanelistTable = Schema::hasTable('group_panelists');
        $relations = ['programSet.academicYear', 'leader'];

        if ($hasGroupAdviserTable) {
            $relations[] = 'adviserAssignment.adviser';
        }

        if ($hasGroupPanelistTable) {
            $relations[] = 'panelAssignments.panelist';
        }

        $group->load($relations);

        $canViewCrossSetGroup = false;
        if (
            $userId !== null &&
            Schema::hasTable('group_members') &&
            Schema::hasTable('program_set_student') &&
            Schema::hasTable('program_sets')
        ) {
            $hasGroupMembersIsCrossSetColumn = Schema::hasColumn('group_members', 'is_cross_set');

            $canViewCrossSetGroup = DB::table('group_members as gm')
                ->join('program_set_student as pss', 'pss.student_id', '=', 'gm.student_id')
                ->join('program_sets as ps', 'ps.id', '=', 'pss.program_set_id')
                ->where('gm.group_id', $group->id)
                ->where('ps.instructor_id', $userId)
                ->when($hasGroupMembersIsCrossSetColumn, fn ($query) => $query->where('gm.is_cross_set', true))
                ->exists();
        }

        if ($userId !== null && $group->programSet?->instructor_id !== $userId && ! $canViewCrossSetGroup) {
            abort(403);
        }

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        $hasStudentProgramTable = Schema::hasTable('student_program');
        $group->load([
            'members' => function ($query) use ($hasStudentProgramTable) {
                if ($hasStudentProgramTable) {
                    $query->with(['studentProgram:id,student_id,program']);
                }
            },
        ]);

        $leaderName = $resolveUserName($group->leader);

        $students = $group->members
            ->map(function (User $student) use ($hasStudentProgramTable): array {
                $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                $fullName = $firstName !== '' || $lastName !== ''
                    ? trim($firstName.' '.$lastName)
                    : (is_string($student->name) ? $student->name : '');
                $program = $hasStudentProgramTable ? $student->studentProgram?->program : null;

                return [
                    'id' => $student->id,
                    'fullName' => $fullName,
                    'email' => $student->email ?? '',
                    'program' => $program,
                    'role' => $student->pivot?->role ?? '',
                ];
            })
            ->values();

        $adviser = $hasGroupAdviserTable ? $group->adviserAssignment?->adviser : null;
        $adviserName = $resolveUserName($adviser);
        $panelists = [];

        if ($hasGroupPanelistTable) {
            $panelists = $group->panelAssignments
                ->sortBy('panel_slot')
                ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                    $panelist = $assignment->panelist;
                    $panelistName = $resolveUserName($panelist);

                    return [
                        'id' => $panelist?->id,
                        'name' => $panelistName !== '' ? $panelistName : null,
                        'email' => $panelist?->email ?? null,
                        'role' => $assignment->role ?? 'member',
                        'slot' => $assignment->panel_slot,
                    ];
                })
                ->values()
                ->all();
        }

        return response()->json([
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'program_set_id' => $group->program_set_id,
                'program' => $group->programSet?->program,
                'school_year' => $group->programSet?->academicYear?->label,
                'leader_name' => $leaderName,
            ],
            'adviser' => $adviser
                ? [
                    'id' => $adviser->id,
                    'name' => $adviserName !== '' ? $adviserName : null,
                    'email' => $adviser->email ?? null,
                ]
                : null,
            'panelists' => $panelists,
            'members' => $students,
        ]);
    })->name('instructor.groups.details');
    Route::get('/program-sets/{programSet}/enrolled-students', function (ProgramSet $programSet) {
        $userId = Auth::guard('web')->id();
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }

        $hasStudentProgramTable = Schema::hasTable('student_program');
        $alreadyGroupedIds = [];

        if (Schema::hasTable('group_members') && Schema::hasTable('groups')) {
            $alreadyGroupedIds = \App\Models\GroupMember::query()
                ->whereHas('group', fn ($query) => $query->where('program_set_id', $programSet->id))
                ->pluck('student_id')
                ->unique()
                ->values()
                ->all();
        }

        $students = $programSet
            ->students()
            ->with($hasStudentProgramTable ? ['studentProgram:id,student_id,program'] : [])
            ->orderBy('last_name')
            ->get(['users.id', 'users.name', 'users.first_name', 'users.last_name', 'users.email'])
            ->map(function (User $student) use ($hasStudentProgramTable, $alreadyGroupedIds): array {
                $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                $fullName = $firstName !== '' || $lastName !== ''
                    ? trim($firstName.' '.$lastName)
                    : (is_string($student->name) ? $student->name : '');
                $program = $hasStudentProgramTable ? $student->studentProgram?->program : null;

                return [
                    'id' => $student->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'name' => $fullName,
                    'email' => $student->email ?? '',
                    'program' => $program,
                    'isGrouped' => in_array($student->id, $alreadyGroupedIds, true),
                ];
            })
            ->values();

        return response()->json([
            'students' => $students,
        ]);
    })->name('instructor.program-sets.enrolled-students');
    Route::get('/students/cross-set-search', CrossSetStudentSearchController::class)->name('instructor.students.cross-set-search');
    Route::post('/groups', \App\Http\Controllers\StoreGroupController::class)->name('instructor.groups.store');
    Route::post('/groups/cross-set-request', StoreCrossSetGroupRequestController::class)->name('instructor.groups.cross-set-request.store');
    Route::patch('/groups/cross-set-request/{crossSetRequest}/approve', ApproveCrossSetGroupRequestController::class)
        ->name('instructor.groups.cross-set-request.approve');
    Route::patch('/groups/cross-set-request/{crossSetRequest}/reject', RejectCrossSetGroupRequestController::class)
        ->name('instructor.groups.cross-set-request.reject');
    Route::put('/groups/{group}/members', UpdateGroupMembersController::class)->name('instructor.groups.members.update');
    Route::delete('/groups/{group}', DestroyGroupController::class)->name('instructor.groups.destroy');
    Route::get('/students', function () {
        $programSets = [];
        try {
            $userId = Auth::guard('web')->id();
            if (class_exists(\App\Models\ProgramSet::class) && \Illuminate\Support\Facades\Schema::hasTable('program_sets')) {
                $hasProgramSetStudentTable = \Illuminate\Support\Facades\Schema::hasTable('program_set_student');
                $hasGroupsTable = \Illuminate\Support\Facades\Schema::hasTable('groups');
                $hasGroupMembersTable = \Illuminate\Support\Facades\Schema::hasTable('group_members');

                $programSetsQuery = \App\Models\ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->orderByDesc('created_at')
                    ->select(['id', 'name', 'program', 'academic_year_id', 'instructor_id']);

                if ($hasProgramSetStudentTable) {
                    $programSetsQuery->withCount('students');
                }

                if ($hasProgramSetStudentTable && $hasGroupsTable) {
                    $unassignedStudentsQuery = DB::table('program_set_student as pss')
                        ->whereColumn('pss.program_set_id', 'program_sets.id')
                        ->whereNotExists(function ($query) use ($hasGroupMembersTable) {
                            $query->select(DB::raw(1))
                                ->from('groups as g')
                                ->whereColumn('g.program_set_id', 'pss.program_set_id')
                                ->where(function ($subQuery) use ($hasGroupMembersTable) {
                                    $subQuery->whereColumn('g.leader_id', 'pss.student_id');

                                    if ($hasGroupMembersTable) {
                                        $subQuery->orWhereExists(function ($memberQuery) {
                                            $memberQuery->select(DB::raw(1))
                                                ->from('group_members as gm')
                                                ->whereColumn('gm.group_id', 'g.id')
                                                ->whereColumn('gm.student_id', 'pss.student_id');
                                        });
                                    }
                                });
                        })
                        ->selectRaw('count(*)');

                    $programSetsQuery->selectSub($unassignedStudentsQuery, 'unassigned_students_count');
                }

                $programSetsQuery = $programSetsQuery->get();

                $programSets = $programSetsQuery
                    ->map(fn ($ps) => [
                        'id' => $ps->id,
                        'name' => $ps->name,
                        'program' => $ps->program,
                        'school_year' => $ps->academicYear?->label,
                        'instructor_name' => $ps->instructor?->name,
                        'students_count' => $hasProgramSetStudentTable ? ($ps->students_count ?? 0) : 0,
                        'unassigned_students_count' => $hasProgramSetStudentTable && $hasGroupsTable ? ((int) $ps->unassigned_students_count) : 0,
                    ])->all();
            }
        } catch (\Throwable $e) {
            $programSets = [];
        }

        return Inertia::render('Instructor/students', ['programSets' => $programSets]);
    })->name('instructor.students');

    Route::get('/students/{programSet}/manage', function (string $programSet) {
        $programSetData = null;
        $availableStudents = [];
        $enrolledStudents = [];
        $programSetModel = null;

        try {
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $userId = Auth::guard('web')->id();
                $programSetModel = ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->whereKey($programSet)
                    ->first();

                if ($programSetModel !== null) {
                    $fallbackName = trim(($programSetModel->program ?? '').' '.($programSetModel->academicYear?->label ?? ''));

                    $programSetData = [
                        'id' => $programSetModel->id,
                        'name' => $programSetModel->name !== null && $programSetModel->name !== '' ? $programSetModel->name : $fallbackName,
                        'program' => $programSetModel->program,
                        'school_year' => $programSetModel->academicYear?->label,
                        'instructor_name' => $programSetModel->instructor?->name,
                    ];
                }
            }
        } catch (\Throwable $e) {
            $programSetData = null;
        }

        if ($programSetData === null) {
            return redirect()->route('instructor.students');
        }

        try {
            $hasStudentProgramTable = Schema::hasTable('student_program');
            $hasGroupsTable = Schema::hasTable('groups');
            $hasGroupMembersTable = Schema::hasTable('group_members');
            $enrolledStudentIds = $programSetModel
                ->students()
                ->pluck('users.id')
                ->map(fn ($studentId): int => (int) $studentId)
                ->unique()
                ->values();
            $assignmentSummaryByStudent = collect();

            if ($hasGroupsTable && $enrolledStudentIds->isNotEmpty()) {
                $memberAssignments = collect();

                if ($hasGroupMembersTable) {
                    $memberAssignments = DB::table('group_members as gm')
                        ->join('groups as g', 'g.id', '=', 'gm.group_id')
                        ->whereIn('gm.student_id', $enrolledStudentIds->all())
                        ->select('gm.student_id', 'gm.group_id', 'g.program_set_id')
                        ->get()
                        ->map(fn ($row): array => [
                            'student_id' => (int) $row->student_id,
                            'group_id' => (int) $row->group_id,
                            'program_set_id' => (int) $row->program_set_id,
                        ]);
                }

                $leaderAssignments = Group::query()
                    ->whereIn('leader_id', $enrolledStudentIds->all())
                    ->select(['id', 'leader_id', 'program_set_id'])
                    ->get()
                    ->map(fn (Group $group): array => [
                        'student_id' => (int) $group->leader_id,
                        'group_id' => (int) $group->id,
                        'program_set_id' => (int) $group->program_set_id,
                    ]);

                $allAssignments = $memberAssignments
                    ->merge($leaderAssignments)
                    ->unique(fn (array $assignment): string => $assignment['student_id'].'-'.$assignment['group_id'])
                    ->values();

                $assignmentSummaryByStudent = $allAssignments
                    ->groupBy('student_id')
                    ->map(function ($assignments) use ($programSetModel): array {
                        $localGroupsCount = (int) $assignments
                            ->where('program_set_id', $programSetModel->id)
                            ->count();
                        $crossSetGroupsCount = (int) $assignments
                            ->where('program_set_id', '!=', $programSetModel->id)
                            ->count();
                        $assignedGroupsCount = (int) $assignments->count();

                        $assignmentType = 'none';
                        if ($assignedGroupsCount > 0) {
                            if ($localGroupsCount > 0 && $crossSetGroupsCount > 0) {
                                $assignmentType = 'mixed';
                            } elseif ($crossSetGroupsCount > 0) {
                                $assignmentType = 'cross_set';
                            } else {
                                $assignmentType = 'local';
                            }
                        }

                        return [
                            'assigned_groups_count' => $assignedGroupsCount,
                            'local_groups_count' => $localGroupsCount,
                            'cross_set_groups_count' => $crossSetGroupsCount,
                            'assignment_type' => $assignmentType,
                        ];
                    });
            }

            $enrolledStudents = $programSetModel
                ->students()
                ->with($hasStudentProgramTable ? ['studentProgram:id,student_id,program'] : [])
                ->orderBy('last_name')
                ->get(['users.id', 'users.name', 'users.first_name', 'users.last_name', 'users.email', 'users.status', 'users.created_at'])
                ->map(function (User $student) use ($hasStudentProgramTable, $assignmentSummaryByStudent): array {
                    $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                    $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                    $fullName = $firstName !== '' || $lastName !== ''
                        ? trim($firstName.' '.$lastName)
                        : (is_string($student->name) ? $student->name : '');
                    $status = is_string($student->status) && $student->status !== '' ? $student->status : 'active';
                    $program = $hasStudentProgramTable ? $student->studentProgram?->program : null;
                    $assignmentSummary = $assignmentSummaryByStudent->get((int) $student->id, [
                        'assigned_groups_count' => 0,
                        'local_groups_count' => 0,
                        'cross_set_groups_count' => 0,
                        'assignment_type' => 'none',
                    ]);
                    $assignedGroupsCount = (int) ($assignmentSummary['assigned_groups_count'] ?? 0);
                    $localGroupsCount = (int) ($assignmentSummary['local_groups_count'] ?? 0);
                    $crossSetGroupsCount = (int) ($assignmentSummary['cross_set_groups_count'] ?? 0);
                    $assignmentType = is_string($assignmentSummary['assignment_type'] ?? null)
                        ? $assignmentSummary['assignment_type']
                        : 'none';
                    $isAssignedToGroup = $assignedGroupsCount > 0;

                    return [
                        'id' => $student->id,
                        'firstName' => $firstName,
                        'lastName' => $lastName,
                        'fullName' => $fullName,
                        'email' => $student->email ?? '',
                        'program' => $program,
                        'status' => $status,
                        'createdAt' => $student->created_at?->format('Y-m-d') ?? '',
                        'isAssignedToGroup' => $isAssignedToGroup,
                        'assignedGroupsCount' => $assignedGroupsCount,
                        'localGroupsCount' => $localGroupsCount,
                        'crossSetGroupsCount' => $crossSetGroupsCount,
                        'groupAssignmentType' => $assignmentType,
                    ];
                })
                ->values();

            $studentsQuery = User::query()
                ->where(function (Builder $query): void {
                    $query
                        ->where('role', 'student')
                        ->orWhereHas('roles', function (Builder $roleQuery): void {
                            $roleQuery->where('slug', 'student');
                        });
                })
                ->whereDoesntHave('programSets', function (Builder $query) use ($programSetModel): void {
                    $query->where('program_sets.id', $programSetModel->id);
                });

            $studentsQuery->withCount([
                'programSets as other_program_sets_count' => function (Builder $query) use ($programSetModel): void {
                    $query->where('program_sets.id', '!=', $programSetModel->id);
                },
            ]);

            if ($hasStudentProgramTable) {
                $studentsQuery->with(['studentProgram:id,student_id,program']);
            }

            $availableStudents = $studentsQuery
                ->orderBy('last_name')
                ->get(['id', 'name', 'first_name', 'last_name', 'email'])
                ->map(function (User $student) use ($hasStudentProgramTable): array {
                    $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                    $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                    $fullName = $firstName !== '' || $lastName !== ''
                        ? trim($firstName.' '.$lastName)
                        : (is_string($student->name) ? $student->name : '');
                    $program = $hasStudentProgramTable ? $student->studentProgram?->program : null;

                    return [
                        'id' => $student->id,
                        'firstName' => $firstName,
                        'lastName' => $lastName,
                        'name' => $fullName,
                        'email' => $student->email ?? '',
                        'program' => $program,
                        'isEnrolledInOtherSet' => (int) ($student->other_program_sets_count ?? 0) > 0,
                    ];
                })
                ->values();
        } catch (\Throwable $e) {
            $availableStudents = [];
            $enrolledStudents = [];
        }

        return Inertia::render('Instructor/students/managePage', [
            'programSet' => $programSetData,
            'availableStudents' => $availableStudents,
            'enrolledStudents' => $enrolledStudents,
        ]);
    })->name('instructor.students.manage');

    Route::get('/students/{programSet}/details', function (string $programSet) {
        $programSetData = null;
        $enrolledStudents = [];
        $programSetModel = null;

        try {
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $userId = Auth::guard('web')->id();
                $programSetModel = ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->whereKey($programSet)
                    ->first();

                if ($programSetModel !== null) {
                    $fallbackName = trim(($programSetModel->program ?? '').' '.($programSetModel->academicYear?->label ?? ''));

                    $programSetData = [
                        'id' => $programSetModel->id,
                        'name' => $programSetModel->name !== null && $programSetModel->name !== '' ? $programSetModel->name : $fallbackName,
                        'program' => $programSetModel->program,
                        'school_year' => $programSetModel->academicYear?->label,
                        'instructor_name' => $programSetModel->instructor?->name,
                    ];
                }
            }
        } catch (\Throwable $e) {
            $programSetData = null;
        }

        if ($programSetData === null) {
            return response()->json(['message' => 'Program set not found.'], 404);
        }

        try {
            $hasStudentProgramTable = Schema::hasTable('student_program');

            $enrolledStudents = $programSetModel
                ->students()
                ->with($hasStudentProgramTable ? ['studentProgram:id,student_id,program'] : [])
                ->orderBy('last_name')
                ->get(['users.id', 'users.name', 'users.first_name', 'users.last_name', 'users.email', 'users.status', 'users.created_at'])
                ->map(function (User $student) use ($hasStudentProgramTable): array {
                    $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                    $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                    $fullName = $firstName !== '' || $lastName !== ''
                        ? trim($firstName.' '.$lastName)
                        : (is_string($student->name) ? $student->name : '');
                    $status = is_string($student->status) && $student->status !== '' ? $student->status : 'active';
                    $program = $hasStudentProgramTable ? $student->studentProgram?->program : null;

                    return [
                        'id' => $student->id,
                        'fullName' => $fullName,
                        'email' => $student->email ?? '',
                        'program' => $program,
                        'status' => $status,
                        'createdAt' => $student->created_at?->format('Y-m-d') ?? '',
                    ];
                })
                ->values();
        } catch (\Throwable $e) {
            $enrolledStudents = [];
        }

        return response()->json([
            'programSet' => $programSetData,
            'enrolledStudents' => $enrolledStudents,
        ]);
    })->name('instructor.students.details');

    Route::post('/students/enroll', EnrollStudentController::class)->name('instructor.students.enroll');
    Route::post('/students/bulk-enroll', BulkEnrollStudentsController::class)->name('instructor.students.bulk-enroll');
    Route::post('/students/unenroll', UnenrollStudentController::class)->name('instructor.students.unenroll');

    // Store program set
    Route::post('/program-sets', [\App\Http\Controllers\StoreProgramSetController::class, '__invoke'])->name('instructor.program-sets.store');
    Route::put('/program-sets/{programSet}', UpdateProgramSetNameController::class)->name('instructor.program-sets.update');
    Route::get('/adviser-assignment', function () {
        $advisers = [];
        $academicYears = [];

        try {
            if (Schema::hasTable('academic_years')) {
                $academicYears = AcademicYear::query()
                    ->orderByDesc('start_year')
                    ->orderByDesc('end_year')
                    ->get(['id', 'label', 'is_current'])
                    ->map(static fn (AcademicYear $academicYear): array => [
                        'id' => $academicYear->id,
                        'label' => $academicYear->label,
                        'is_current' => $academicYear->is_current,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $academicYears = [];
        }

        try {
            if (Schema::hasTable('users')) {
                $hasRoleTables = Schema::hasTable('roles') && Schema::hasTable('role_user');

                $advisersQuery = User::query()
                    ->where(function (Builder $query) use ($hasRoleTables) {
                        if ($hasRoleTables) {
                            $query
                                ->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('slug', 'adviser'))
                                ->orWhere('role', 'like', '%adviser%');

                            return;
                        }

                        $query->where('role', 'like', '%adviser%');
                    })
                    ->orderBy('last_name')
                    ->get(['id', 'name', 'first_name', 'last_name', 'email']);

                $relations = [];
                if (Schema::hasTable('group_advisers') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                    $relations['advisedGroups'] = function ($query) {
                        $query->with('programSet.academicYear');
                    };
                }
                if (Schema::hasTable('adviser_program_utilities')) {
                    $relations[] = 'adviserProgramUtilities';
                }
                if (Schema::hasTable('adviser_availabilities')) {
                    $relations[] = 'adviserAvailability';
                }
                if (count($relations) > 0) {
                    $advisersQuery->load($relations);
                }

                $advisers = $advisersQuery
                    ->map(function (User $adviser): array {
                        $firstName = is_string($adviser->first_name) ? trim($adviser->first_name) : '';
                        $lastName = is_string($adviser->last_name) ? trim($adviser->last_name) : '';
                        $fullName = $firstName !== '' || $lastName !== ''
                            ? trim($firstName.' '.$lastName)
                            : (is_string($adviser->name) ? $adviser->name : '');

                        $workloads = [];
                        $assignedByProgramYear = collect();
                        if ($adviser->relationLoaded('advisedGroups')) {
                            $resolveAcademicYearLabel = static function (\App\Models\Group $group): string {
                                $programSet = $group->programSet;
                                $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                                return $label !== '' ? $label : 'Unspecified';
                            };

                            $workloads = $adviser->advisedGroups
                                ->groupBy($resolveAcademicYearLabel)
                                ->map(fn ($groups, $label): array => [
                                    'academic_year' => $label,
                                    'groups_count' => $groups->count(),
                                ])
                                ->values()
                                ->all();

                            $assignedByProgramYear = $adviser->advisedGroups
                                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                                ->map(
                                    fn ($groups) => $groups
                                        ->groupBy($resolveAcademicYearLabel)
                                        ->map(fn ($yearGroups) => $yearGroups->count()),
                                );
                        }

                        $utilityMap = $adviser->relationLoaded('adviserProgramUtilities')
                            ? $adviser->adviserProgramUtilities
                                ->filter(fn (AdviserProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                                ->keyBy('program')
                            : collect();

                        $assignedByProgram = $adviser->relationLoaded('advisedGroups')
                            ? $adviser->advisedGroups
                                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                                ->map(fn ($groups) => $groups->count())
                            : collect();

                        $programSummaries = $utilityMap
                            ->keys()
                            ->merge($assignedByProgram->keys())
                            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
                            ->unique()
                            ->sort()
                            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $assignedByProgramYear): array {
                                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;
                                $assignedByYear = collect($assignedByProgramYear->get($program, []))
                                    ->mapWithKeys(fn ($count, $label): array => [$label => $count])
                                    ->all();

                                return [
                                    'program' => $program,
                                    'max_groups' => $maxGroups,
                                    'assigned_count' => $assignedByProgram->get($program, 0),
                                    'assigned_by_year' => $assignedByYear,
                                ];
                            })
                            ->values()
                            ->all();

                        $isAvailable = $adviser->relationLoaded('adviserAvailability')
                            ? (bool) ($adviser->adviserAvailability?->is_available ?? false)
                            : false;

                        return [
                            'id' => $adviser->id,
                            'name' => $fullName,
                            'email' => $adviser->email ?? '',
                            'workloads' => $workloads,
                            'is_available' => $isAvailable,
                            'programs' => $programSummaries,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $advisers = [];
        }

        return Inertia::render('Instructor/adviser-assignment', [
            'advisers' => $advisers,
            'academicYears' => $academicYears,
        ]);
    })->name('instructor.adviser-assignment');
    Route::get('/adviser-assignment/{adviser}/manage', function (User $adviser) {
        if (! $adviser->hasRole('adviser')) {
            abort(404);
        }

        $academicYears = [];
        try {
            if (Schema::hasTable('academic_years')) {
                $academicYears = AcademicYear::query()
                    ->orderByDesc('start_year')
                    ->orderByDesc('end_year')
                    ->get(['id', 'label', 'is_current'])
                    ->map(static fn (AcademicYear $academicYear): array => [
                        'id' => $academicYear->id,
                        'label' => $academicYear->label,
                        'is_current' => $academicYear->is_current,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $academicYears = [];
        }

        $selectedAcademicYear = request()->query('academic_year');
        $selectedAcademicYear = is_string($selectedAcademicYear) ? $selectedAcademicYear : null;

        $relations = [];
        if (Schema::hasTable('group_advisers') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $relations['advisedGroups'] = function ($query) {
                $query->with('programSet.academicYear');
            };
        }
        if (Schema::hasTable('adviser_program_utilities')) {
            $relations[] = 'adviserProgramUtilities';
        }
        if (Schema::hasTable('adviser_availabilities')) {
            $relations[] = 'adviserAvailability';
        }
        if (count($relations) > 0) {
            $adviser->load($relations);
        }

        $userId = Auth::guard('web')->id();

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        $workloads = [];
        $assignedByProgramYear = collect();
        if ($adviser->relationLoaded('advisedGroups')) {
            $resolveAcademicYearLabel = static function (\App\Models\Group $group): string {
                $programSet = $group->programSet;
                $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                return $label !== '' ? $label : 'Unspecified';
            };

            $workloads = $adviser->advisedGroups
                ->groupBy($resolveAcademicYearLabel)
                ->map(fn ($groups, $label): array => [
                    'academic_year' => $label,
                    'groups_count' => $groups->count(),
                ])
                ->values()
                ->all();

            $assignedByProgramYear = $adviser->advisedGroups
                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                ->map(
                    fn ($groups) => $groups
                        ->groupBy($resolveAcademicYearLabel)
                        ->map(fn ($yearGroups) => $yearGroups->count()),
                );
        }

        $utilityMap = $adviser->relationLoaded('adviserProgramUtilities')
            ? $adviser->adviserProgramUtilities
                ->filter(fn (AdviserProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                ->keyBy('program')
            : collect();

        $assignedByProgram = $adviser->relationLoaded('advisedGroups')
            ? $adviser->advisedGroups
                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                ->map(fn ($groups) => $groups->count())
            : collect();

        $programSummaries = $utilityMap
            ->keys()
            ->merge($assignedByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $assignedByProgramYear): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;
                $assignedByYear = collect($assignedByProgramYear->get($program, []))
                    ->mapWithKeys(fn ($count, $label): array => [$label => $count])
                    ->all();

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                    'assigned_by_year' => $assignedByYear,
                ];
            })
            ->values()
            ->all();

        $isAvailable = $adviser->relationLoaded('adviserAvailability')
            ? (bool) ($adviser->adviserAvailability?->is_available ?? false)
            : false;

        $groups = [];
        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $pendingRequestsByGroup = collect();

                if (Schema::hasTable('group_adviser_requests')) {
                    $pendingRequestsByGroup = GroupAdviserRequest::query()
                        ->where('adviser_id', $adviser->id)
                        ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
                        ->where('status', GroupAdviserRequest::STATUS_PENDING)
                        ->pluck('id', 'group_id');
                }

                $groups = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader', 'adviserAssignment.adviser'])
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->withCount('members')
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName, $pendingRequestsByGroup): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $adviserName = $resolveUserName($group->adviserAssignment?->adviser);

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'adviser_id' => $group->adviserAssignment?->adviser_id,
                            'adviser_name' => $adviserName !== '' ? $adviserName : null,
                            'members_count' => $group->members_count ?? 0,
                            'pending_request_id' => $pendingRequestsByGroup->get($group->id),
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        return Inertia::render('Instructor/adviser-assignment/adviser-assignment-groups', [
            'adviser' => [
                'id' => $adviser->id,
                'name' => $resolveUserName($adviser),
                'email' => $adviser->email ?? '',
                'workloads' => $workloads,
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
            'groups' => $groups,
            'academicYears' => $academicYears,
            'selectedAcademicYear' => $selectedAcademicYear,
        ]);
    })->name('instructor.adviser-assignment.manage');
    Route::get('/adviser-assignment/{adviser}/groups', function (User $adviser) {
        if (! $adviser->hasRole('adviser')) {
            abort(404);
        }

        $groups = [];
        $academicYearFilter = request()->query('academic_year');
        $userId = Auth::guard('web')->id();

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groupsQuery = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader'])
                    ->whereHas('adviserAssignment', fn ($query) => $query->where('adviser_id', $adviser->id))
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->withCount('members')
                    ->orderByDesc('created_at');

                if (is_string($academicYearFilter) && $academicYearFilter !== '' && $academicYearFilter !== 'All') {
                    $groupsQuery->whereHas('programSet', function ($query) use ($academicYearFilter) {
                        $query->where(function ($subQuery) use ($academicYearFilter) {
                            $subQuery->whereHas('academicYear', fn ($academicQuery) => $academicQuery->where('label', $academicYearFilter));

                            if (Schema::hasColumn('program_sets', 'school_year')) {
                                $subQuery->orWhere('school_year', $academicYearFilter);
                            }
                        });
                    });
                }

                $groups = $groupsQuery
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'members_count' => $group->members_count ?? 0,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        $isAvailable = false;
        $utilityMap = collect();

        try {
            if (Schema::hasTable('adviser_availabilities')) {
                $availability = AdviserAvailability::query()
                    ->where('adviser_id', $adviser->id)
                    ->value('is_available');

                if ($availability !== null) {
                    $isAvailable = (bool) $availability;
                }
            }
        } catch (\Throwable $e) {
            $isAvailable = false;
        }

        try {
            if (Schema::hasTable('adviser_program_utilities')) {
                $utilityMap = AdviserProgramUtility::query()
                    ->where('adviser_id', $adviser->id)
                    ->get(['program', 'max_groups'])
                    ->filter(fn (AdviserProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                    ->keyBy('program');
            }
        } catch (\Throwable $e) {
            $utilityMap = collect();
        }

        $assignedByProgram = collect($groups)
            ->filter(fn (array $group): bool => is_string($group['program'] ?? null) && $group['program'] !== '')
            ->groupBy('program')
            ->map(fn ($items) => $items->count());

        $programSummaries = $utilityMap
            ->keys()
            ->merge($assignedByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'groups' => $groups,
            'summary' => [
                'assigned_count' => count($groups),
                'academic_year' => is_string($academicYearFilter) && $academicYearFilter !== '' ? $academicYearFilter : 'All',
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
        ]);
    })->name('instructor.adviser-assignment.groups');
    Route::post('/adviser-assignment/assign', AssignGroupAdviserController::class)->name('instructor.adviser-assignment.assign');
    Route::get('/panelist-assignment', function () {
        $academicYears = [];
        try {
            if (Schema::hasTable('academic_years')) {
                $academicYears = AcademicYear::query()
                    ->orderByDesc('start_year')
                    ->orderByDesc('end_year')
                    ->get(['id', 'label', 'is_current'])
                    ->map(static fn (AcademicYear $academicYear): array => [
                        'id' => $academicYear->id,
                        'label' => $academicYear->label,
                        'is_current' => $academicYear->is_current,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $academicYears = [];
        }

        $panelists = [];
        try {
            if (Schema::hasTable('users')) {
                $hasRoleTables = Schema::hasTable('roles') && Schema::hasTable('role_user');
                $panelistsQuery = User::query()
                    ->when($hasRoleTables, function ($query) {
                        $query->where(function ($roleQuery) {
                            $roleQuery->where('role', 'like', '%panelist%')
                                ->orWhereHas('roles', fn ($subQuery) => $subQuery->where('slug', 'panelist'));
                        });
                    }, function ($query) {
                        $query->where('role', 'like', '%panelist%');
                    })
                    ->orderBy('last_name')
                    ->get(['id', 'name', 'first_name', 'last_name', 'email']);

                $relations = [];
                if (Schema::hasTable('group_panelists') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                    $relations['panelGroups'] = function ($query) {
                        $query->with('programSet.academicYear');
                    };
                }
                if (Schema::hasTable('panelist_program_utilities')) {
                    $relations[] = 'panelistProgramUtilities';
                }
                if (Schema::hasTable('panelist_availabilities')) {
                    $relations[] = 'panelistAvailability';
                }
                if (count($relations) > 0) {
                    $panelistsQuery->load($relations);
                }

                $panelists = $panelistsQuery
                    ->map(function (User $panelist): array {
                        $firstName = is_string($panelist->first_name) ? trim($panelist->first_name) : '';
                        $lastName = is_string($panelist->last_name) ? trim($panelist->last_name) : '';
                        $fullName = $firstName !== '' || $lastName !== ''
                            ? trim($firstName.' '.$lastName)
                            : (is_string($panelist->name) ? $panelist->name : '');

                        $workloads = [];
                        $assignedByProgramYear = collect();
                        if ($panelist->relationLoaded('panelGroups')) {
                            $resolveAcademicYearLabel = static function (\App\Models\Group $group): string {
                                $programSet = $group->programSet;
                                $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                                return $label !== '' ? $label : 'Unspecified';
                            };

                            $workloads = $panelist->panelGroups
                                ->groupBy($resolveAcademicYearLabel)
                                ->map(fn ($groups, $label): array => [
                                    'academic_year' => $label,
                                    'groups_count' => $groups->count(),
                                ])
                                ->values()
                                ->all();

                            $assignedByProgramYear = $panelist->panelGroups
                                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                                ->map(
                                    fn ($groups) => $groups
                                        ->groupBy($resolveAcademicYearLabel)
                                        ->map(fn ($yearGroups) => $yearGroups->count()),
                                );
                        }

                        $utilityMap = $panelist->relationLoaded('panelistProgramUtilities')
                            ? $panelist->panelistProgramUtilities
                                ->filter(fn (PanelistProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                                ->keyBy('program')
                            : collect();

                        $assignedByProgram = $panelist->relationLoaded('panelGroups')
                            ? $panelist->panelGroups
                                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                                ->map(fn ($groups) => $groups->count())
                            : collect();

                        $programSummaries = $utilityMap
                            ->keys()
                            ->merge($assignedByProgram->keys())
                            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
                            ->unique()
                            ->sort()
                            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $assignedByProgramYear): array {
                                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;
                                $assignedByYear = collect($assignedByProgramYear->get($program, []))
                                    ->mapWithKeys(fn ($count, $label): array => [$label => $count])
                                    ->all();

                                return [
                                    'program' => $program,
                                    'max_groups' => $maxGroups,
                                    'assigned_count' => $assignedByProgram->get($program, 0),
                                    'assigned_by_year' => $assignedByYear,
                                ];
                            })
                            ->values()
                            ->all();

                        $isAvailable = $panelist->relationLoaded('panelistAvailability')
                            ? (bool) ($panelist->panelistAvailability?->is_available ?? false)
                            : false;

                        return [
                            'id' => $panelist->id,
                            'name' => $fullName,
                            'email' => $panelist->email ?? '',
                            'workloads' => $workloads,
                            'is_available' => $isAvailable,
                            'programs' => $programSummaries,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $panelists = [];
        }

        return Inertia::render('Instructor/panelist-assignment', [
            'panelists' => $panelists,
            'academicYears' => $academicYears,
        ]);
    })->name('instructor.panelist-assignment');
    Route::get('/panelist-assignment/{panelist}/manage', function (User $panelist) {
        if (! $panelist->hasRole('panelist')) {
            abort(404);
        }

        $academicYears = [];
        try {
            if (Schema::hasTable('academic_years')) {
                $academicYears = AcademicYear::query()
                    ->orderByDesc('start_year')
                    ->orderByDesc('end_year')
                    ->get(['id', 'label', 'is_current'])
                    ->map(static fn (AcademicYear $academicYear): array => [
                        'id' => $academicYear->id,
                        'label' => $academicYear->label,
                        'is_current' => $academicYear->is_current,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $academicYears = [];
        }

        $selectedAcademicYear = request()->query('academic_year');
        $selectedAcademicYear = is_string($selectedAcademicYear) ? $selectedAcademicYear : null;

        $relations = [];
        if (Schema::hasTable('group_panelists') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $relations['panelGroups'] = function ($query) {
                $query->with('programSet.academicYear');
            };
        }
        if (Schema::hasTable('panelist_program_utilities')) {
            $relations[] = 'panelistProgramUtilities';
        }
        if (Schema::hasTable('panelist_availabilities')) {
            $relations[] = 'panelistAvailability';
        }
        if (count($relations) > 0) {
            $panelist->load($relations);
        }

        $userId = Auth::guard('web')->id();

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        $workloads = [];
        $assignedByProgramYear = collect();
        if ($panelist->relationLoaded('panelGroups')) {
            $resolveAcademicYearLabel = static function (\App\Models\Group $group): string {
                $programSet = $group->programSet;
                $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                return $label !== '' ? $label : 'Unspecified';
            };

            $workloads = $panelist->panelGroups
                ->groupBy($resolveAcademicYearLabel)
                ->map(fn ($groups, $label): array => [
                    'academic_year' => $label,
                    'groups_count' => $groups->count(),
                ])
                ->values()
                ->all();

            $assignedByProgramYear = $panelist->panelGroups
                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                ->map(
                    fn ($groups) => $groups
                        ->groupBy($resolveAcademicYearLabel)
                        ->map(fn ($yearGroups) => $yearGroups->count()),
                );
        }

        $utilityMap = $panelist->relationLoaded('panelistProgramUtilities')
            ? $panelist->panelistProgramUtilities
                ->filter(fn (PanelistProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                ->keyBy('program')
            : collect();

        $assignedByProgram = $panelist->relationLoaded('panelGroups')
            ? $panelist->panelGroups
                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                ->map(fn ($groups) => $groups->count())
            : collect();

        $programSummaries = $utilityMap
            ->keys()
            ->merge($assignedByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $assignedByProgramYear): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;
                $assignedByYear = collect($assignedByProgramYear->get($program, []))
                    ->mapWithKeys(fn ($count, $label): array => [$label => $count])
                    ->all();

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                    'assigned_by_year' => $assignedByYear,
                ];
            })
            ->values()
            ->all();

        $isAvailable = $panelist->relationLoaded('panelistAvailability')
            ? (bool) ($panelist->panelistAvailability?->is_available ?? false)
            : false;

        $panelists = [];
        try {
            if (Schema::hasTable('users')) {
                $hasRoleTables = Schema::hasTable('roles') && Schema::hasTable('role_user');
                $panelistsQuery = User::query()
                    ->when($hasRoleTables, function ($query) {
                        $query->where(function ($roleQuery) {
                            $roleQuery->where('role', 'like', '%panelist%')
                                ->orWhereHas('roles', fn ($subQuery) => $subQuery->where('slug', 'panelist'));
                        });
                    }, function ($query) {
                        $query->where('role', 'like', '%panelist%');
                    })
                    ->orderBy('last_name')
                    ->get(['id', 'name', 'first_name', 'last_name', 'email']);

                $panelistRelations = [];
                if (Schema::hasTable('group_panelists') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                    $panelistRelations['panelGroups'] = function ($query) {
                        $query->with('programSet.academicYear');
                    };
                }
                if (Schema::hasTable('panelist_program_utilities')) {
                    $panelistRelations[] = 'panelistProgramUtilities';
                }
                if (Schema::hasTable('panelist_availabilities')) {
                    $panelistRelations[] = 'panelistAvailability';
                }
                if (count($panelistRelations) > 0) {
                    $panelistsQuery->load($panelistRelations);
                }

                $panelists = $panelistsQuery
                    ->map(function (User $optionPanelist) use ($resolveUserName): array {
                        $assignedByProgramYear = $optionPanelist->relationLoaded('panelGroups')
                            ? $optionPanelist->panelGroups
                                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                                ->map(
                                    fn ($groups) => $groups
                                        ->groupBy(function (\App\Models\Group $group): string {
                                            $programSet = $group->programSet;
                                            $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                                            return $label !== '' ? $label : 'Unspecified';
                                        })
                                        ->map(fn ($yearGroups) => $yearGroups->count()),
                                )
                            : collect();

                        $utilityMap = $optionPanelist->relationLoaded('panelistProgramUtilities')
                            ? $optionPanelist->panelistProgramUtilities
                                ->filter(fn (PanelistProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                                ->keyBy('program')
                            : collect();

                        $assignedByProgram = $optionPanelist->relationLoaded('panelGroups')
                            ? $optionPanelist->panelGroups
                                ->groupBy(fn (\App\Models\Group $group): ?string => $group->programSet?->program)
                                ->map(fn ($groups) => $groups->count())
                            : collect();

                        $programSummaries = $utilityMap
                            ->keys()
                            ->merge($assignedByProgram->keys())
                            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
                            ->unique()
                            ->sort()
                            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $assignedByProgramYear): array {
                                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;
                                $assignedByYear = collect($assignedByProgramYear->get($program, []))
                                    ->mapWithKeys(fn ($count, $label): array => [$label => $count])
                                    ->all();

                                return [
                                    'program' => $program,
                                    'max_groups' => $maxGroups,
                                    'assigned_count' => $assignedByProgram->get($program, 0),
                                    'assigned_by_year' => $assignedByYear,
                                ];
                            })
                            ->values()
                            ->all();

                        $isAvailable = $optionPanelist->relationLoaded('panelistAvailability')
                            ? (bool) ($optionPanelist->panelistAvailability?->is_available ?? false)
                            : false;

                        return [
                            'id' => $optionPanelist->id,
                            'name' => $resolveUserName($optionPanelist),
                            'email' => $optionPanelist->email ?? '',
                            'is_available' => $isAvailable,
                            'programs' => $programSummaries,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $panelists = [];
        }

        $groups = [];
        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader', 'panelAssignments.panelist'])
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->withCount('members')
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $panelists = $group->panelAssignments
                            ->sortBy('panel_slot')
                            ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                                $panelist = $assignment->panelist;
                                $panelistName = $resolveUserName($panelist);

                                return [
                                    'id' => $panelist?->id,
                                    'name' => $panelistName !== '' ? $panelistName : null,
                                    'email' => $panelist?->email ?? null,
                                    'slot' => $assignment->panel_slot,
                                    'role' => $assignment->role ?? 'member',
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'members_count' => $group->members_count ?? 0,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        return Inertia::render('Instructor/panelist-assignment/panelist-assignment-groups', [
            'panelist' => [
                'id' => $panelist->id,
                'name' => $resolveUserName($panelist),
                'email' => $panelist->email ?? '',
                'workloads' => $workloads,
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
            'panelists' => $panelists,
            'groups' => $groups,
            'academicYears' => $academicYears,
            'selectedAcademicYear' => $selectedAcademicYear,
        ]);
    })->name('instructor.panelist-assignment.manage');
    Route::get('/panelist-assignment/{panelist}/groups', function (User $panelist) {
        if (! $panelist->hasRole('panelist')) {
            abort(404);
        }

        $groups = [];
        $academicYearFilter = request()->query('academic_year');
        $userId = Auth::guard('web')->id();

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groupsQuery = \App\Models\Group::query()
                    ->with([
                        'programSet.academicYear',
                        'leader',
                        'panelAssignments' => fn ($query) => $query->where('panelist_id', $panelist->id),
                    ])
                    ->whereHas('panelAssignments', fn ($query) => $query->where('panelist_id', $panelist->id))
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->withCount('members')
                    ->orderByDesc('created_at');

                if (is_string($academicYearFilter) && $academicYearFilter !== '' && $academicYearFilter !== 'All') {
                    $groupsQuery->whereHas('programSet', function ($query) use ($academicYearFilter) {
                        $query->where(function ($subQuery) use ($academicYearFilter) {
                            $subQuery->whereHas('academicYear', fn ($academicQuery) => $academicQuery->where('label', $academicYearFilter));

                            if (Schema::hasColumn('program_sets', 'school_year')) {
                                $subQuery->orWhere('school_year', $academicYearFilter);
                            }
                        });
                    });
                }

                $groups = $groupsQuery
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $panelAssignment = $group->panelAssignments->first();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'members_count' => $group->members_count ?? 0,
                            'panel_role' => $panelAssignment?->role ?? 'member',
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        $isAvailable = false;
        $utilityMap = collect();

        try {
            if (Schema::hasTable('panelist_availabilities')) {
                $availability = PanelistAvailability::query()
                    ->where('panelist_id', $panelist->id)
                    ->value('is_available');

                if ($availability !== null) {
                    $isAvailable = (bool) $availability;
                }
            }
        } catch (\Throwable $e) {
            $isAvailable = false;
        }

        try {
            if (Schema::hasTable('panelist_program_utilities')) {
                $utilityMap = PanelistProgramUtility::query()
                    ->where('panelist_id', $panelist->id)
                    ->get(['program', 'max_groups'])
                    ->filter(fn (PanelistProgramUtility $utility): bool => trim((string) $utility->program) !== '')
                    ->keyBy('program');
            }
        } catch (\Throwable $e) {
            $utilityMap = collect();
        }

        $assignedByProgram = collect($groups)
            ->filter(fn (array $group): bool => is_string($group['program'] ?? null) && $group['program'] !== '')
            ->groupBy('program')
            ->map(fn ($items) => $items->count());

        $programSummaries = $utilityMap
            ->keys()
            ->merge($assignedByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'groups' => $groups,
            'summary' => [
                'assigned_count' => count($groups),
                'academic_year' => is_string($academicYearFilter) && $academicYearFilter !== '' ? $academicYearFilter : 'All',
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
        ]);
    })->name('instructor.panelist-assignment.groups');
    Route::post('/panelist-assignment/assign', AssignGroupPanelistController::class)->name('instructor.panelist-assignment.assign');
    Route::get('/scheduling', function () {
        $userId = Auth::guard('web')->id();
        $groups = [];
        $rooms = [];
        $schedules = [];

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (class_exists(\App\Models\DefenseRoom::class) && Schema::hasTable('defense_rooms')) {
                $rooms = \App\Models\DefenseRoom::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'capacity', 'is_active', 'notes'])
                    ->map(fn (\App\Models\DefenseRoom $room): array => [
                        'id' => $room->id,
                        'name' => $room->name,
                        'capacity' => $room->capacity,
                        'is_active' => $room->is_active,
                        'notes' => $room->notes,
                    ])
                    ->all();
            }
        } catch (\Throwable $e) {
            $rooms = [];
        }

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader', 'panelAssignments.panelist'])
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $panelists = $group->panelAssignments
                            ->sortBy('panel_slot')
                            ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                                $panelist = $assignment->panelist;
                                $panelistName = $resolveUserName($panelist);

                                return [
                                    'id' => $panelist?->id,
                                    'name' => $panelistName !== '' ? $panelistName : null,
                                    'slot' => $assignment->panel_slot,
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        try {
            if (class_exists(\App\Models\DefenseSchedule::class) && Schema::hasTable('defense_schedules')) {
                $schedules = \App\Models\DefenseSchedule::query()
                    ->with(['group.programSet.academicYear', 'group.programSet.instructor', 'group.panelAssignments.panelist', 'room'])
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->get()
                    ->map(function (\App\Models\DefenseSchedule $schedule) use ($resolveUserName, $userId): array {
                        $group = $schedule->group;
                        $programSet = $group?->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $manager = $programSet?->instructor;
                        $managerName = $resolveUserName($manager);
                        $panelists = $group?->panelAssignments
                            ? $group->panelAssignments
                                ->sortBy('panel_slot')
                                ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                                    $panelist = $assignment->panelist;
                                    $panelistName = $resolveUserName($panelist);

                                    return [
                                        'id' => $panelist?->id,
                                        'name' => $panelistName !== '' ? $panelistName : null,
                                        'slot' => $assignment->panel_slot,
                                    ];
                                })
                                ->values()
                                ->all()
                            : [];

                        return [
                            'id' => $schedule->id,
                            'group_id' => $group?->id,
                            'group_name' => $group?->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'stage' => $schedule->stage,
                            'status' => $schedule->status,
                            'scheduled_date' => $schedule->scheduled_date?->format('Y-m-d'),
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'notes' => $schedule->notes,
                            'room' => $schedule->room
                                ? [
                                    'id' => $schedule->room->id,
                                    'name' => $schedule->room->name,
                                    'capacity' => $schedule->room->capacity,
                                    'is_active' => $schedule->room->is_active,
                                ]
                                : null,
                            'manager' => [
                                'id' => $manager?->id,
                                'name' => $managerName !== '' ? $managerName : null,
                            ],
                            'can_manage' => $userId !== null && $programSet?->instructor_id === $userId,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $schedules = [];
        }

        return Inertia::render('Instructor/scheduling', [
            'groups' => $groups,
            'rooms' => $rooms,
            'schedules' => $schedules,
        ]);
    })->name('instructor.scheduling');
    Route::get('/scheduling/rooms', function () {
        $rooms = [];

        try {
            if (class_exists(\App\Models\DefenseRoom::class) && Schema::hasTable('defense_rooms')) {
                $rooms = \App\Models\DefenseRoom::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'capacity', 'is_active', 'notes'])
                    ->map(fn (\App\Models\DefenseRoom $room): array => [
                        'id' => $room->id,
                        'name' => $room->name,
                        'capacity' => $room->capacity,
                        'is_active' => $room->is_active,
                        'notes' => $room->notes,
                    ])
                    ->all();
            }
        } catch (\Throwable $e) {
            $rooms = [];
        }

        return Inertia::render('Instructor/scheduling/rooms', [
            'rooms' => $rooms,
        ]);
    })->name('instructor.scheduling.rooms');
    Route::get('/scheduling/manage', function () {
        $userId = Auth::guard('web')->id();
        $groups = [];
        $rooms = [];
        $schedules = [];

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (class_exists(\App\Models\DefenseRoom::class) && Schema::hasTable('defense_rooms')) {
                $rooms = \App\Models\DefenseRoom::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'capacity', 'is_active', 'notes'])
                    ->map(fn (\App\Models\DefenseRoom $room): array => [
                        'id' => $room->id,
                        'name' => $room->name,
                        'capacity' => $room->capacity,
                        'is_active' => $room->is_active,
                        'notes' => $room->notes,
                    ])
                    ->all();
            }
        } catch (\Throwable $e) {
            $rooms = [];
        }

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader', 'panelAssignments.panelist'])
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $panelists = $group->panelAssignments
                            ->sortBy('panel_slot')
                            ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                                $panelist = $assignment->panelist;
                                $panelistName = $resolveUserName($panelist);

                                return [
                                    'id' => $panelist?->id,
                                    'name' => $panelistName !== '' ? $panelistName : null,
                                    'slot' => $assignment->panel_slot,
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        try {
            if (class_exists(\App\Models\DefenseSchedule::class) && Schema::hasTable('defense_schedules')) {
                $schedules = \App\Models\DefenseSchedule::query()
                    ->with(['group.programSet.academicYear', 'group.programSet.instructor', 'group.panelAssignments.panelist', 'room'])
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->get()
                    ->map(function (\App\Models\DefenseSchedule $schedule) use ($resolveUserName, $userId): array {
                        $group = $schedule->group;
                        $programSet = $group?->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $manager = $programSet?->instructor;
                        $managerName = $resolveUserName($manager);
                        $panelists = $group?->panelAssignments
                            ? $group->panelAssignments
                                ->sortBy('panel_slot')
                                ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                                    $panelist = $assignment->panelist;
                                    $panelistName = $resolveUserName($panelist);

                                    return [
                                        'id' => $panelist?->id,
                                        'name' => $panelistName !== '' ? $panelistName : null,
                                        'slot' => $assignment->panel_slot,
                                    ];
                                })
                                ->values()
                                ->all()
                            : [];

                        return [
                            'id' => $schedule->id,
                            'group_id' => $group?->id,
                            'group_name' => $group?->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'stage' => $schedule->stage,
                            'status' => $schedule->status,
                            'scheduled_date' => $schedule->scheduled_date?->format('Y-m-d'),
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'notes' => $schedule->notes,
                            'room' => $schedule->room
                                ? [
                                    'id' => $schedule->room->id,
                                    'name' => $schedule->room->name,
                                    'capacity' => $schedule->room->capacity,
                                    'is_active' => $schedule->room->is_active,
                                    'notes' => $schedule->room->notes,
                                ]
                                : null,
                            'manager' => [
                                'id' => $manager?->id,
                                'name' => $managerName !== '' ? $managerName : null,
                            ],
                            'can_manage' => $userId !== null && $programSet?->instructor_id === $userId,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $schedules = [];
        }

        $selectedScheduleId = request()->integer('schedule') ?: null;
        $defaultDate = request()->query('date');
        $defaultRoomId = request()->integer('room') ?: null;
        $defaultStage = request()->query('stage');

        if (! is_string($defaultDate) || $defaultDate === '') {
            $defaultDate = null;
        }

        if (! is_string($defaultStage) || $defaultStage === '') {
            $defaultStage = null;
        }
        if (! in_array($defaultStage, ['Concept', 'Outline', 'Pre-Deployment', 'Deployment', 'Final'], true)) {
            $defaultStage = null;
        }

        return Inertia::render('Instructor/scheduling/manage', [
            'groups' => $groups,
            'rooms' => $rooms,
            'schedules' => $schedules,
            'selectedScheduleId' => $selectedScheduleId,
            'defaultDate' => $defaultDate,
            'defaultRoomId' => $defaultRoomId,
            'defaultStage' => $defaultStage,
        ]);
    })->name('instructor.scheduling.manage');
    Route::post('/defense-rooms', StoreDefenseRoomController::class)->name('instructor.defense-rooms.store');
    Route::patch('/defense-rooms/{room}', UpdateDefenseRoomController::class)->name('instructor.defense-rooms.update');
    Route::delete('/defense-rooms/{room}', DestroyDefenseRoomController::class)->name('instructor.defense-rooms.destroy');
    Route::post('/defense-schedules', UpsertDefenseScheduleController::class)->name('instructor.defense-schedules.upsert');
    Route::patch('/defense-schedules/{schedule}/status', UpdateDefenseScheduleStatusController::class)
        ->name('instructor.defense-schedules.status');
    Route::get('/titles', function () {
        return Inertia::render('Instructor/titles');
    })->name('instructor.titles');
    Route::get('/concepts', function () {
        return Inertia::render('Instructor/concepts');
    })->name('instructor.concepts');
    Route::get('/phase1', function () {
        $userId = Auth::guard('web')->id();
        $programSets = [];
        $groups = [];
        $defenseSchedules = [];
        $requirements = [];
        $documentSubmissions = [];
        $academicYears = [];
        $settings = [
            'titleProposalDeadline' => '',
            'finalDefenseDeadline' => '',
        ];

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $programSets = ProgramSet::query()
                    ->with('academicYear')
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->orderByDesc('created_at')
                    ->get(['id', 'name', 'program', 'academic_year_id', 'instructor_id'])
                    ->map(function (ProgramSet $programSet): array {
                        $schoolYear = $programSet->academicYear?->label;

                        if ($schoolYear === null && Schema::hasColumn('program_sets', 'school_year')) {
                            $schoolYear = $programSet->school_year;
                        }

                        return [
                            'id' => $programSet->id,
                            'name' => $programSet->name,
                            'program' => $programSet->program,
                            'school_year' => $schoolYear,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $programSets = [];
        }

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader', 'members'])
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->withCount('members')
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label;

                        if ($schoolYear === null && $programSet && Schema::hasColumn('program_sets', 'school_year')) {
                            $schoolYear = $programSet->school_year;
                        }

                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);

                        $members = $group->members
                            ? $group->members
                                ->map(fn (User $member): array => [
                                    'id' => $member->id,
                                    'name' => $resolveUserName($member),
                                ])
                                ->values()
                                ->all()
                            : [];

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'members' => $members,
                            'members_count' => $group->members_count ?? 0,
                            'created_at' => $group->created_at?->format('Y-m-d'),
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        try {
            if (class_exists(\App\Models\DefenseSchedule::class) && Schema::hasTable('defense_schedules')) {
                $defenseSchedules = \App\Models\DefenseSchedule::query()
                    ->with(['group.programSet.academicYear', 'room'])
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->get()
                    ->map(function (\App\Models\DefenseSchedule $schedule): array {
                        $group = $schedule->group;
                        $programSet = $group?->programSet;
                        $schoolYear = $programSet?->academicYear?->label;

                        if ($schoolYear === null && $programSet && Schema::hasColumn('program_sets', 'school_year')) {
                            $schoolYear = $programSet->school_year;
                        }

                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));

                        return [
                            'id' => $schedule->id,
                            'group_id' => $group?->id,
                            'group_name' => $group?->name,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'stage' => $schedule->stage,
                            'status' => $schedule->status,
                            'scheduled_date' => $schedule->scheduled_date?->format('Y-m-d'),
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'room' => $schedule->room
                                ? [
                                    'id' => $schedule->room->id,
                                    'name' => $schedule->room->name,
                                ]
                                : null,
                            'created_at' => $schedule->created_at?->format('Y-m-d'),
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $defenseSchedules = [];
        }

        try {
            if (Schema::hasTable('academic_years')) {
                $academicYears = AcademicYear::query()
                    ->orderByDesc('start_year')
                    ->orderByDesc('end_year')
                    ->get(['id', 'label', 'is_current'])
                    ->map(static fn (AcademicYear $academicYear): array => [
                        'id' => $academicYear->id,
                        'label' => $academicYear->label,
                        'is_current' => $academicYear->is_current,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $academicYears = [];
        }

        try {
            if (class_exists(DocumentRequirement::class) && Schema::hasTable('document_requirements')) {
                $requirements = DocumentRequirement::query()
                    ->with('academicYear')
                    ->where('stage', 'Concept')
                    ->orderBy('due_date')
                    ->get()
                    ->map(static fn (DocumentRequirement $requirement): array => [
                        'id' => $requirement->id,
                        'requirement_type' => $requirement->requirement_type,
                        'due_date' => $requirement->due_date?->format('Y-m-d'),
                        'is_mandatory' => $requirement->is_mandatory,
                        'academic_year_id' => $requirement->academic_year_id,
                        'academic_year_label' => $requirement->academicYear?->label,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $requirements = [];
        }

        try {
            if (class_exists(DocumentSubmission::class) && Schema::hasTable('document_submissions')) {
                $groupIds = collect($groups)->pluck('id')->filter()->values();
                $requirementIds = collect($requirements)->pluck('id')->filter()->values();

                if ($groupIds->isNotEmpty() && $requirementIds->isNotEmpty()) {
                    $documentSubmissions = DocumentSubmission::query()
                        ->with('requirement')
                        ->whereIn('group_id', $groupIds)
                        ->whereIn('document_requirement_id', $requirementIds)
                        ->orderByDesc('created_at')
                        ->get()
                        ->map(static fn (DocumentSubmission $submission): array => [
                            'id' => $submission->id,
                            'group_id' => $submission->group_id,
                            'document_requirement_id' => $submission->document_requirement_id,
                            'requirement_type' => $submission->requirement?->requirement_type,
                            'status' => $submission->status,
                            'file_name' => $submission->file_name,
                            'file_path' => $submission->file_path,
                            'mime_type' => $submission->mime_type,
                            'file_size' => $submission->file_size,
                            'submitted_at' => $submission->created_at?->format('Y-m-d'),
                        ])
                        ->values()
                        ->all();
                }
            }
        } catch (\Throwable $e) {
            $documentSubmissions = [];
        }

        try {
            if (class_exists(\App\Models\SystemSetting::class) && Schema::hasTable('system_settings')) {
                $settingsQuery = \App\Models\SystemSetting::query()
                    ->whereIn('key', ['titleProposalDeadline', 'finalDefenseDeadline'])
                    ->pluck('value', 'key');

                $settings = [
                    'titleProposalDeadline' => (string) ($settingsQuery['titleProposalDeadline'] ?? ''),
                    'finalDefenseDeadline' => (string) ($settingsQuery['finalDefenseDeadline'] ?? ''),
                ];
            }
        } catch (\Throwable $e) {
            $settings = [
                'titleProposalDeadline' => '',
                'finalDefenseDeadline' => '',
            ];
        }

        return Inertia::render('Instructor/phase1', [
            'programSets' => $programSets,
            'groups' => $groups,
            'defenseSchedules' => $defenseSchedules,
            'requirements' => $requirements,
            'documentSubmissions' => $documentSubmissions,
            'academicYears' => $academicYears,
            'settings' => $settings,
        ]);
    })->name('instructor.phase1');
    Route::get('/requirements/documents', function () {
        $userId = Auth::guard('web')->id();
        $groupQueryValue = request()->query('group');
        $selectedGroupId = is_numeric($groupQueryValue) ? (int) $groupQueryValue : null;
        $groupOptions = [];
        $selectedGroup = null;
        $documents = [];

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if ($userId !== null && class_exists(Group::class) && Schema::hasTable('groups')) {
                $groupCollection = Group::query()
                    ->with(['programSet.academicYear', 'leader:id,name,first_name,last_name', 'adviserAssignment.adviser:id,name,first_name,last_name,email'])
                    ->whereHas('programSet', fn ($query) => $query->where('instructor_id', $userId))
                    ->orderByDesc('updated_at')
                    ->get(['id', 'name', 'program_set_id', 'leader_id', 'updated_at']);

                $groupOptions = $groupCollection
                    ->map(function (Group $group): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'programSetName' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'schoolYear' => $schoolYear,
                        ];
                    })
                    ->values()
                    ->all();

                /** @var Group|null $activeGroup */
                $activeGroup = $selectedGroupId !== null
                    ? $groupCollection->firstWhere('id', $selectedGroupId)
                    : $groupCollection->first();

                if (! $activeGroup instanceof Group) {
                    /** @var Group|null $activeGroup */
                    $activeGroup = $groupCollection->first();
                }

                if ($activeGroup instanceof Group) {
                    $selectedGroupId = $activeGroup->id;
                    $programSet = $activeGroup->programSet;
                    $adviserAssignment = $activeGroup->adviserAssignment;
                    $adviser = $adviserAssignment?->adviser;
                    $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                    $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                    $leaderName = $resolveUserName($activeGroup->leader);

                    $selectedGroup = [
                        'id' => $activeGroup->id,
                        'name' => $activeGroup->name,
                        'leaderName' => $leaderName !== '' ? $leaderName : null,
                        'programSetName' => $programSet?->name ?: $fallbackName,
                        'program' => $programSet?->program,
                        'schoolYear' => $schoolYear,
                        'adviser' => $adviser
                            ? [
                                'id' => $adviser->id,
                                'name' => $resolveUserName($adviser),
                                'email' => $adviser->email,
                                'assignedAt' => $adviserAssignment?->created_at?->format('Y-m-d H:i'),
                            ]
                            : null,
                    ];

                    if (class_exists(DocumentRequirement::class) && Schema::hasTable('document_requirements')) {
                        $requirementsQuery = DocumentRequirement::query()
                            ->with('academicYear')
                            ->where('stage', 'Concept')
                            ->orderBy('due_date')
                            ->orderBy('id');

                        $requirements = $requirementsQuery
                            ->get(['id', 'requirement_type', 'due_date', 'academic_year_id'])
                            ->filter(function (DocumentRequirement $requirement) use ($schoolYear): bool {
                                $requirementAcademicYear = $requirement->academicYear?->label;

                                if (! is_string($requirementAcademicYear) || trim($requirementAcademicYear) === '') {
                                    return true;
                                }

                                if (! is_string($schoolYear) || trim($schoolYear) === '') {
                                    return false;
                                }

                                return $requirementAcademicYear === $schoolYear;
                            })
                            ->values();
                        $latestSubmissionByRequirementId = collect();

                        if (
                            class_exists(DocumentSubmission::class)
                            && Schema::hasTable('document_submissions')
                            && $requirements->isNotEmpty()
                        ) {
                            $latestSubmissionByRequirementId = DocumentSubmission::query()
                                ->where('group_id', $activeGroup->id)
                                ->whereIn('document_requirement_id', $requirements->pluck('id')->all())
                                ->orderByDesc('created_at')
                                ->orderByDesc('id')
                                ->get(['id', 'group_id', 'document_requirement_id', 'file_name', 'status', 'created_at'])
                                ->unique('document_requirement_id')
                                ->keyBy('document_requirement_id');
                        }

                        $documents = $requirements
                            ->map(function (DocumentRequirement $requirement) use ($activeGroup, $latestSubmissionByRequirementId): array {
                                /** @var DocumentSubmission|null $submission */
                                $submission = $latestSubmissionByRequirementId->get($requirement->id);
                                $status = match ((string) ($submission?->status ?? '')) {
                                    'Approved' => 'Approved',
                                    'Revision Required' => 'Revision Required',
                                    default => $submission ? 'Submitted' : 'Missing',
                                };

                                $requirementType = trim((string) ($requirement->requirement_type ?? 'Requirement'));
                                $isConceptRequirement = str_contains(strtolower($requirementType), 'concept');
                                $isRecommendationRequirement = str_contains(strtolower($requirementType), 'recommendation');
                                $canReview = $submission instanceof DocumentSubmission && ($isConceptRequirement || $isRecommendationRequirement);
                                $reviewUrl = null;

                                if ($canReview) {
                                    if ($isConceptRequirement) {
                                        $reviewUrl = route('instructor.requirements.documents.review', [
                                            'group' => $activeGroup->id,
                                            'requirement' => $requirement->id,
                                        ]);
                                    } else {
                                        $reviewUrl = route('instructor.requirements.documents.submission-preview', [
                                            'submission' => $submission->id,
                                        ]);
                                    }
                                }

                                return [
                                    'requirementId' => $requirement->id,
                                    'requirementType' => $requirementType !== '' ? $requirementType : 'Requirement',
                                    'academicYear' => $requirement->academicYear?->label ?? 'All',
                                    'dueDate' => $requirement->due_date?->format('Y-m-d'),
                                    'status' => $status,
                                    'fileName' => $submission?->file_name,
                                    'submittedAt' => $submission?->created_at?->format('Y-m-d H:i'),
                                    'canReview' => $canReview,
                                    'reviewUrl' => $reviewUrl,
                                ];
                            })
                            ->values()
                            ->all();
                    }
                }
            }
        } catch (\Throwable $e) {
            $groupOptions = [];
            $selectedGroup = null;
            $documents = [];
        }

        return Inertia::render('Instructor/requirements/documents', [
            'groupOptions' => $groupOptions,
            'selectedGroupId' => $selectedGroupId,
            'selectedGroup' => $selectedGroup,
            'documents' => $documents,
        ]);
    })->name('instructor.requirements.documents.index');
    Route::get('/requirements/documents/review', function () {
        $userId = Auth::guard('web')->id();
        $groupQueryValue = request()->query('group');
        $requirementQueryValue = request()->query('requirement');
        $selectedGroupId = is_numeric($groupQueryValue) ? (int) $groupQueryValue : null;
        $selectedRequirementId = is_numeric($requirementQueryValue) ? (int) $requirementQueryValue : null;
        $selectedRequirementType = null;
        $groups = [];

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (
                $selectedRequirementId !== null
                && class_exists(DocumentRequirement::class)
                && Schema::hasTable('document_requirements')
            ) {
                /** @var DocumentRequirement|null $selectedRequirement */
                $selectedRequirement = DocumentRequirement::query()
                    ->where('stage', 'Concept')
                    ->find($selectedRequirementId, ['id', 'requirement_type']);

                if ($selectedRequirement instanceof DocumentRequirement) {
                    $selectedRequirementType = $selectedRequirement->requirement_type;
                } else {
                    $selectedRequirementId = null;
                }
            }

            if ($userId !== null && class_exists(Group::class) && Schema::hasTable('groups')) {
                $groupCollection = Group::query()
                    ->with(['programSet.academicYear', 'leader:id,name,first_name,last_name', 'adviserAssignment.adviser:id,name,first_name,last_name,email'])
                    ->whereHas('programSet', fn ($query) => $query->where('instructor_id', $userId))
                    ->orderByDesc('updated_at')
                    ->get(['id', 'name', 'program_set_id', 'leader_id', 'updated_at']);

                $groupIds = $groupCollection->pluck('id')->filter()->values();
                $conceptSubmissionsByGroup = collect();

                if (
                    class_exists(DocumentSubmission::class)
                    && Schema::hasTable('document_submissions')
                    && Schema::hasTable('document_requirements')
                    && $groupIds->isNotEmpty()
                ) {
                    $conceptSubmissionsByGroup = DocumentSubmission::query()
                        ->with('requirement:id,requirement_type,stage')
                        ->whereIn('group_id', $groupIds)
                        ->whereHas('requirement', function ($query): void {
                            $query->where('stage', 'Concept')
                                ->whereRaw('LOWER(requirement_type) like ?', ['%concept%']);
                        })
                        ->when($selectedRequirementId !== null, fn ($query) => $query->where('document_requirement_id', $selectedRequirementId))
                        ->orderByDesc('created_at')
                        ->orderByDesc('id')
                        ->get([
                            'id',
                            'group_id',
                            'document_requirement_id',
                            'file_name',
                            'file_path',
                            'status',
                            'adviser_status',
                            'adviser_reviewed_at',
                            'created_at',
                        ])
                        ->groupBy('group_id');
                }

                $groups = $groupCollection
                    ->map(function (Group $group) use ($conceptSubmissionsByGroup, $resolveUserName): array {
                        $programSet = $group->programSet;
                        $adviserAssignment = $group->adviserAssignment;
                        $adviser = $adviserAssignment?->adviser;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);

                        $groupSubmissions = $conceptSubmissionsByGroup->get($group->id, collect());
                        $submissions = $groupSubmissions
                            ->map(static function (DocumentSubmission $submission): array {
                                $status = match ((string) $submission->status) {
                                    'Approved' => 'Approved',
                                    'Revision Required' => 'Revision Required',
                                    default => 'Submitted',
                                };

                                return [
                                    'id' => $submission->id,
                                    'title' => $submission->file_name ?: 'Concept Paper Submission',
                                    'requirementType' => $submission->requirement?->requirement_type ?? 'Concept Paper',
                                    'status' => $status,
                                    'adviserStatus' => match ((string) $submission->adviser_status) {
                                        'Approved' => 'Approved',
                                        'Revision Required' => 'Revision Required',
                                        default => 'Submitted',
                                    },
                                    'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                                    'adviserReviewedAt' => $submission->adviser_reviewed_at?->format('Y-m-d H:i'),
                                    'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'leaderName' => $leaderName !== '' ? $leaderName : null,
                            'programSetName' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'schoolYear' => $schoolYear,
                            'adviser' => $adviser
                                ? [
                                    'id' => $adviser->id,
                                    'name' => $resolveUserName($adviser),
                                    'email' => $adviser->email,
                                    'assignedAt' => $adviserAssignment?->created_at?->format('Y-m-d H:i'),
                                ]
                                : null,
                            'submissions' => $submissions,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
            $selectedRequirementType = null;
        }

        return Inertia::render('Instructor/requirements/documents-review', [
            'groups' => $groups,
            'selectedGroupId' => $selectedGroupId,
            'selectedRequirementId' => $selectedRequirementId,
            'selectedRequirementType' => $selectedRequirementType,
        ]);
    })->name('instructor.requirements.documents.review');
    Route::get('/requirements/documents/submissions/{submission}/preview', function (DocumentSubmission $submission) {
        $userId = Auth::guard('web')->id();
        $submission->loadMissing([
            'group.programSet:id,instructor_id,name,program',
            'requirement:id,requirement_type,stage',
        ]);

        if ($userId === null || (int) ($submission->group?->programSet?->instructor_id ?? 0) !== (int) $userId) {
            abort(403);
        }

        return Inertia::render('Instructor/requirements/submission-preview', [
            'submission' => [
                'id' => $submission->id,
                'groupId' => $submission->group?->id,
                'groupName' => $submission->group?->name ?? 'Group',
                'programSetName' => $submission->group?->programSet?->name,
                'program' => $submission->group?->programSet?->program,
                'requirementType' => $submission->requirement?->requirement_type ?? 'Document',
                'fileName' => $submission->file_name,
                'fileUrl' => Storage::disk('public')->url($submission->file_path),
                'status' => $submission->status,
                'adviserStatus' => $submission->adviser_status,
                'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                'signedAt' => $submission->adviser_reviewed_at?->format('Y-m-d H:i'),
            ],
        ]);
    })->name('instructor.requirements.documents.submission-preview');
    Route::get('/requirements/{group}/documents', function (Group $group) {
        $userId = Auth::guard('web')->id();

        $group->loadMissing('programSet:id,instructor_id');
        if ($userId === null || $group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        return redirect()->route('instructor.requirements.documents.index', ['group' => $group->id]);
    })->name('instructor.requirements.documents');
    Route::get('/document-submissions/{submission}/download', DownloadDocumentSubmissionController::class)
        ->name('instructor.document-submissions.download');
    Route::patch('/document-submissions/{submission}/status', UpdateDocumentSubmissionStatusController::class)
        ->name('instructor.document-submissions.status');
    Route::post('/requirements', StoreDocumentRequirementController::class)->name('instructor.requirements.store');
    Route::patch('/requirements/{requirement}', UpdateDocumentRequirementController::class)->name('instructor.requirements.update');
    Route::delete('/requirements/{requirement}', DestroyDocumentRequirementController::class)->name('instructor.requirements.destroy');
    Route::get('/notifications', function () {
        return Inertia::render('Instructor/notifications');
    })->name('instructor.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Instructor/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('instructor.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('instructor.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('instructor.settings.e-signature.delete');
});
