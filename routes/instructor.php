<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\AssignGroupAdviserController;
use App\Http\Controllers\AssignGroupPanelistController;
use App\Http\Controllers\BulkEnrollStudentsController;
use App\Http\Controllers\DestroyDefenseRoomController;
use App\Http\Controllers\EnrollStudentController;
use App\Http\Controllers\StoreDefenseRoomController;
use App\Http\Controllers\UnenrollStudentController;
use App\Http\Controllers\UpdateDefenseRoomController;
use App\Http\Controllers\UpdateDefenseScheduleStatusController;
use App\Http\Controllers\UpdateGroupMembersController;
use App\Http\Controllers\UpdateProgramSetNameController;
use App\Http\Controllers\UpsertDefenseScheduleController;
use App\Models\AcademicYear;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:instructor'])->prefix('instructor')->group(function () {
    Route::get('/dashboard', function () {
        $userId = Auth::guard('web')->id();
        $programSetIds = [];
        $programSetsCount = 0;
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
        ];
        $latestSchedulesByGroup = collect();
        $panelCountsByGroup = collect();
        $groups = [];
        $upcomingSchedules = [];
        $attentionItems = [];

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
                    ->pluck('id')
                    ->all();
                $programSetsCount = count($programSetIds);
            }
        } catch (\Throwable $e) {
            $programSetIds = [];
            $programSetsCount = 0;
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
                            'Concept' => 25,
                            'Outline' => 50,
                            'Pre-Deployment' => 75,
                            'Deployment' => 100,
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
            'stageScale' => $stageScale,
            'groups' => $groups,
            'upcomingSchedules' => $upcomingSchedules,
            'attentionItems' => $attentionItems,
        ]);
    })->name('instructor.dashboard');
    Route::get('/groups', function () {
        $programSets = [];

        try {
            $userId = Auth::guard('web')->id();
            if (class_exists(\App\Models\ProgramSet::class) && Schema::hasTable('program_sets')) {
                $hasProgramSetStudentTable = Schema::hasTable('program_set_student');
                $hasGroupsTable = Schema::hasTable('groups');

                $programSetsQuery = \App\Models\ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->when($hasProgramSetStudentTable, fn ($query) => $query->withCount('students'))
                    ->when($hasGroupsTable, fn ($query) => $query->withCount('groups'))
                    ->orderByDesc('created_at')
                    ->get(['id', 'name', 'program', 'academic_year_id', 'instructor_id']);

                $programSets = $programSetsQuery
                    ->map(fn ($ps) => [
                        'id' => $ps->id,
                        'name' => $ps->name,
                        'program' => $ps->program,
                        'school_year' => $ps->academicYear?->label,
                        'instructor_name' => $ps->instructor?->name,
                        'students_count' => $hasProgramSetStudentTable ? ($ps->students_count ?? 0) : 0,
                        'groups_count' => $hasGroupsTable ? ($ps->groups_count ?? 0) : 0,
                    ])->all();
            }
        } catch (\Throwable $e) {
            $programSets = [];
        }

        return Inertia::render('Instructor/groups', [
            'programSets' => $programSets,
        ]);
    })->name('instructor.groups');
    Route::get('/groups/{programSet}/manage', function (ProgramSet $programSet) {
        $userId = Auth::guard('web')->id();
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }

        $programSet->load('academicYear');
        $groups = [];

        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['leader'])
                    ->where('program_set_id', $programSet->id)
                    ->withCount('members')
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (\App\Models\Group $group): array {
                        $leader = $group->leader;
                        $leaderName = $leader
                            ? trim(collect([$leader->first_name ?? '', $leader->last_name ?? ''])->filter()->join(' '))
                            : '';

                        if ($leaderName === '' && $leader) {
                            $leaderName = (string) $leader->name;
                        }

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $group->program_set_id,
                            'leader_name' => $leaderName,
                            'members_count' => $group->members_count ?? 0,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        return Inertia::render('Instructor/groups/managePage', [
            'programSet' => [
                'id' => $programSet->id,
                'name' => $programSet->name,
                'program' => $programSet->program,
                'school_year' => $programSet->academicYear?->label,
            ],
            'groups' => $groups,
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

        if ($userId !== null && $group->programSet?->instructor_id !== $userId) {
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
    Route::post('/groups', \App\Http\Controllers\StoreGroupController::class)->name('instructor.groups.store');
    Route::put('/groups/{group}/members', UpdateGroupMembersController::class)->name('instructor.groups.members.update');
    Route::get('/students', function () {
        $programSets = [];
        try {
            $userId = Auth::guard('web')->id();
            if (class_exists(\App\Models\ProgramSet::class) && \Illuminate\Support\Facades\Schema::hasTable('program_sets')) {
                $hasProgramSetStudentTable = \Illuminate\Support\Facades\Schema::hasTable('program_set_student');

                $programSetsQuery = \App\Models\ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->orderByDesc('created_at')
                    ->get(['id', 'name', 'program', 'academic_year_id', 'instructor_id']);

                if ($hasProgramSetStudentTable) {
                    $programSetsQuery = \App\Models\ProgramSet::query()
                        ->with(['academicYear', 'instructor'])
                        ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                        ->withCount('students')
                        ->orderByDesc('created_at')
                        ->get(['id', 'name', 'program', 'academic_year_id', 'instructor_id']);
                }

                $programSets = $programSetsQuery
                    ->map(fn ($ps) => [
                        'id' => $ps->id,
                        'name' => $ps->name,
                        'program' => $ps->program,
                        'school_year' => $ps->academicYear?->label,
                        'instructor_name' => $ps->instructor?->name,
                        'students_count' => $hasProgramSetStudentTable ? ($ps->students_count ?? 0) : 0,
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
                        'firstName' => $firstName,
                        'lastName' => $lastName,
                        'fullName' => $fullName,
                        'email' => $student->email ?? '',
                        'program' => $program,
                        'status' => $status,
                        'createdAt' => $student->created_at?->format('Y-m-d') ?? '',
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
                $advisersQuery = User::query()
                    ->where('role', 'like', '%adviser%')
                    ->orderBy('last_name')
                    ->get(['id', 'name', 'first_name', 'last_name', 'email']);

                if (Schema::hasTable('group_advisers') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                    $advisersQuery->load([
                        'advisedGroups' => function ($query) {
                            $query->with('programSet.academicYear');
                        },
                    ]);
                }

                $advisers = $advisersQuery
                    ->map(function (User $adviser): array {
                        $firstName = is_string($adviser->first_name) ? trim($adviser->first_name) : '';
                        $lastName = is_string($adviser->last_name) ? trim($adviser->last_name) : '';
                        $fullName = $firstName !== '' || $lastName !== ''
                            ? trim($firstName.' '.$lastName)
                            : (is_string($adviser->name) ? $adviser->name : '');

                        $workloads = [];
                        if ($adviser->relationLoaded('advisedGroups')) {
                            $workloads = $adviser->advisedGroups
                                ->groupBy(function (\App\Models\Group $group): string {
                                    $programSet = $group->programSet;
                                    $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                                    return $label !== '' ? $label : 'Unspecified';
                                })
                                ->map(fn ($groups, $label): array => [
                                    'academic_year' => $label,
                                    'groups_count' => $groups->count(),
                                ])
                                ->values()
                                ->all();
                        }

                        return [
                            'id' => $adviser->id,
                            'name' => $fullName,
                            'email' => $adviser->email ?? '',
                            'workloads' => $workloads,
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

        if (Schema::hasTable('group_advisers') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $adviser->load([
                'advisedGroups' => function ($query) {
                    $query->with('programSet.academicYear');
                },
            ]);
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
        if ($adviser->relationLoaded('advisedGroups')) {
            $workloads = $adviser->advisedGroups
                ->groupBy(function (\App\Models\Group $group): string {
                    $programSet = $group->programSet;
                    $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                    return $label !== '' ? $label : 'Unspecified';
                })
                ->map(fn ($groups, $label): array => [
                    'academic_year' => $label,
                    'groups_count' => $groups->count(),
                ])
                ->values()
                ->all();
        }

        $groups = [];
        try {
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                $groups = \App\Models\Group::query()
                    ->with(['programSet.academicYear', 'leader', 'adviserAssignment.adviser'])
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

        return response()->json([
            'groups' => $groups,
            'summary' => [
                'assigned_count' => count($groups),
                'max_load' => 5,
                'academic_year' => is_string($academicYearFilter) && $academicYearFilter !== '' ? $academicYearFilter : 'All',
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

                if (Schema::hasTable('group_panelists') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                    $panelistsQuery->load([
                        'panelGroups' => function ($query) {
                            $query->with('programSet.academicYear');
                        },
                    ]);
                }

                $panelists = $panelistsQuery
                    ->map(function (User $panelist): array {
                        $firstName = is_string($panelist->first_name) ? trim($panelist->first_name) : '';
                        $lastName = is_string($panelist->last_name) ? trim($panelist->last_name) : '';
                        $fullName = $firstName !== '' || $lastName !== ''
                            ? trim($firstName.' '.$lastName)
                            : (is_string($panelist->name) ? $panelist->name : '');

                        $workloads = [];
                        if ($panelist->relationLoaded('panelGroups')) {
                            $workloads = $panelist->panelGroups
                                ->groupBy(function (\App\Models\Group $group): string {
                                    $programSet = $group->programSet;
                                    $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                                    return $label !== '' ? $label : 'Unspecified';
                                })
                                ->map(fn ($groups, $label): array => [
                                    'academic_year' => $label,
                                    'groups_count' => $groups->count(),
                                ])
                                ->values()
                                ->all();
                        }

                        return [
                            'id' => $panelist->id,
                            'name' => $fullName,
                            'email' => $panelist->email ?? '',
                            'workloads' => $workloads,
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

        if (Schema::hasTable('group_panelists') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $panelist->load([
                'panelGroups' => function ($query) {
                    $query->with('programSet.academicYear');
                },
            ]);
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
        if ($panelist->relationLoaded('panelGroups')) {
            $workloads = $panelist->panelGroups
                ->groupBy(function (\App\Models\Group $group): string {
                    $programSet = $group->programSet;
                    $label = $programSet?->academicYear?->label ?? $programSet?->school_year ?? '';

                    return $label !== '' ? $label : 'Unspecified';
                })
                ->map(fn ($groups, $label): array => [
                    'academic_year' => $label,
                    'groups_count' => $groups->count(),
                ])
                ->values()
                ->all();
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

                $panelists = $panelistsQuery
                    ->map(function (User $panelist) use ($resolveUserName): array {
                        return [
                            'id' => $panelist->id,
                            'name' => $resolveUserName($panelist),
                            'email' => $panelist->email ?? '',
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

        return response()->json([
            'groups' => $groups,
            'summary' => [
                'assigned_count' => count($groups),
                'academic_year' => is_string($academicYearFilter) && $academicYearFilter !== '' ? $academicYearFilter : 'All',
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
        if (! in_array($defaultStage, ['Concept', 'Outline', 'Pre-Deployment', 'Deployment'], true)) {
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
            'settings' => $settings,
        ]);
    })->name('instructor.phase1');

    Route::get('/evaluation', function () {
        return Inertia::render('Instructor/evaluation');
    })->name('instructor.evaluation');
    Route::get('/verdict', function () {
        return Inertia::render('Instructor/verdict');
    })->name('instructor.verdict');
    Route::get('/minutes', function () {
        return Inertia::render('Instructor/minutes');
    })->name('instructor.minutes');
    Route::get('/deadlines', function () {
        return Inertia::render('Instructor/deadlines');
    })->name('instructor.deadlines');
    Route::get('/deployment', function () {
        return Inertia::render('Instructor/deployment');
    })->name('instructor.deployment');
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
