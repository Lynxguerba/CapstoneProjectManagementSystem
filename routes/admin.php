<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminSystemSettingsController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Models\AcademicYear;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/students', [AdminUserController::class, 'students'])->name('admin.users.students');
    Route::get('/users/faculty', [AdminUserController::class, 'faculty'])->name('admin.users.faculty');
    Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::post('/users/bulk', [AdminUserController::class, 'bulkStore'])->name('admin.users.bulk-store');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::get('/monitoring/sections', function () {
        $sections = [];
        $academicYears = [];
        $programOptions = [];
        $pagination = [
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 10,
            'total' => 0,
        ];
        $filters = [
            'search' => request()->string('search')->toString(),
            'program' => request()->string('program')->toString(),
            'academic_year' => request()->string('academic_year')->toString(),
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
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $hasProgramSetStudentTable = Schema::hasTable('program_set_student');
                $hasGroupsTable = Schema::hasTable('groups');

                $programOptions = ProgramSet::query()
                    ->whereNotNull('program')
                    ->distinct()
                    ->orderBy('program')
                    ->pluck('program')
                    ->filter()
                    ->values()
                    ->all();

                $programSetsQuery = ProgramSet::query()
                    ->with(['academicYear', 'instructor'])
                    ->when($hasProgramSetStudentTable, fn ($query) => $query->withCount('students'))
                    ->when($hasGroupsTable, fn ($query) => $query->withCount('groups'))
                    ->when($filters['program'] !== '' && $filters['program'] !== 'All', function ($query) use ($filters) {
                        $query->where('program', $filters['program']);
                    })
                    ->when($filters['academic_year'] !== '' && $filters['academic_year'] !== 'All', function ($query) use ($filters) {
                        $query->where(function ($subQuery) use ($filters) {
                            $subQuery->whereHas('academicYear', fn ($yearQuery) => $yearQuery->where('label', $filters['academic_year']));

                            if (Schema::hasColumn('program_sets', 'school_year')) {
                                $subQuery->orWhere('school_year', $filters['academic_year']);
                            }
                        });
                    })
                    ->when($filters['search'] !== '', function ($query) use ($filters) {
                        $query->where(function ($subQuery) use ($filters) {
                            $term = $filters['search'];

                            $subQuery
                                ->where('name', 'like', '%'.$term.'%')
                                ->orWhere('program', 'like', '%'.$term.'%')
                                ->orWhereHas('instructor', function ($instructorQuery) use ($term) {
                                    $instructorQuery
                                        ->where('first_name', 'like', '%'.$term.'%')
                                        ->orWhere('last_name', 'like', '%'.$term.'%')
                                        ->orWhere('name', 'like', '%'.$term.'%');
                                });
                        });
                    })
                    ->orderByDesc('created_at');

                $programSetsPaginator = $programSetsQuery->paginate(10)->withQueryString();
                $sections = $programSetsPaginator
                    ->getCollection()
                    ->map(function (ProgramSet $programSet) use ($resolveUserName, $hasProgramSetStudentTable, $hasGroupsTable): array {
                        $schoolYear = $programSet->academicYear?->label ?? $programSet->school_year;
                        $instructorName = $resolveUserName($programSet->instructor);

                        return [
                            'id' => $programSet->id,
                            'name' => $programSet->name,
                            'program' => $programSet->program,
                            'school_year' => $schoolYear,
                            'instructor_name' => $instructorName !== '' ? $instructorName : null,
                            'students_count' => $hasProgramSetStudentTable ? ($programSet->students_count ?? 0) : 0,
                            'groups_count' => $hasGroupsTable ? ($programSet->groups_count ?? 0) : 0,
                        ];
                    })
                    ->values()
                    ->all();

                $pagination = [
                    'current_page' => $programSetsPaginator->currentPage(),
                    'last_page' => $programSetsPaginator->lastPage(),
                    'per_page' => $programSetsPaginator->perPage(),
                    'total' => $programSetsPaginator->total(),
                ];
            }
        } catch (\Throwable $e) {
            $sections = [];
        }

        return Inertia::render('Admin/monitoring/sections', [
            'sections' => $sections,
            'academicYears' => $academicYears,
            'programOptions' => $programOptions,
            'filters' => [
                'search' => $filters['search'],
                'program' => $filters['program'] !== '' ? $filters['program'] : 'All',
                'academic_year' => $filters['academic_year'] !== '' ? $filters['academic_year'] : 'All',
            ],
            'pagination' => $pagination,
        ]);
    })->name('admin.monitoring.sections');
    Route::get('/monitoring/groups', function () {
        $groups = [];
        $academicYears = [];
        $programOptions = [];
        $programSets = [];
        $pagination = [
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 10,
            'total' => 0,
        ];
        $filters = [
            'search' => request()->string('search')->toString(),
            'program' => request()->string('program')->toString(),
            'academic_year' => request()->string('academic_year')->toString(),
            'program_set' => request()->string('program_set')->toString(),
        ];
        $hasGroupAdviserTable = Schema::hasTable('group_advisers');
        $hasGroupPanelistTable = Schema::hasTable('group_panelists');

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
            if (class_exists(\App\Models\Group::class) && Schema::hasTable('groups')) {
                if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                    $programOptions = ProgramSet::query()
                        ->whereNotNull('program')
                        ->distinct()
                        ->orderBy('program')
                        ->pluck('program')
                        ->filter()
                        ->values()
                        ->all();

                    $programSets = ProgramSet::query()
                        ->orderBy('name')
                        ->get(['id', 'name'])
                        ->map(fn (ProgramSet $programSet): array => [
                            'id' => $programSet->id,
                            'name' => $programSet->name,
                        ])
                        ->values()
                        ->all();
                }

                $relations = ['programSet.academicYear', 'leader'];

                if ($hasGroupAdviserTable) {
                    $relations[] = 'adviserAssignment.adviser';
                }

                if ($hasGroupPanelistTable) {
                    $relations[] = 'panelAssignments.panelist';
                }

                $programSetFilter = $filters['program_set'] !== '' && $filters['program_set'] !== 'All'
                    ? (int) $filters['program_set']
                    : null;

                $groupsQuery = \App\Models\Group::query()
                    ->with($relations)
                    ->withCount('members')
                    ->when($filters['program'] !== '' && $filters['program'] !== 'All', function ($query) use ($filters) {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('program', $filters['program']));
                    })
                    ->when($programSetFilter !== null, function ($query) use ($programSetFilter) {
                        $query->where('program_set_id', $programSetFilter);
                    })
                    ->when($filters['academic_year'] !== '' && $filters['academic_year'] !== 'All', function ($query) use ($filters) {
                        $query->whereHas('programSet', function ($subQuery) use ($filters) {
                            $subQuery->where(function ($yearQuery) use ($filters) {
                                $yearQuery->whereHas('academicYear', fn ($academicQuery) => $academicQuery->where('label', $filters['academic_year']));

                                if (Schema::hasColumn('program_sets', 'school_year')) {
                                    $yearQuery->orWhere('school_year', $filters['academic_year']);
                                }
                            });
                        });
                    })
                    ->when($filters['search'] !== '', function ($query) use ($filters, $hasGroupAdviserTable) {
                        $query->where(function ($subQuery) use ($filters, $hasGroupAdviserTable) {
                            $term = $filters['search'];

                            $subQuery
                                ->where('name', 'like', '%'.$term.'%')
                                ->orWhereHas('programSet', function ($programSetQuery) use ($term) {
                                    $programSetQuery
                                        ->where('name', 'like', '%'.$term.'%')
                                        ->orWhere('program', 'like', '%'.$term.'%');
                                })
                                ->orWhereHas('leader', function ($leaderQuery) use ($term) {
                                    $leaderQuery
                                        ->where('first_name', 'like', '%'.$term.'%')
                                        ->orWhere('last_name', 'like', '%'.$term.'%')
                                        ->orWhere('name', 'like', '%'.$term.'%');
                                });

                            if ($hasGroupAdviserTable) {
                                $subQuery->orWhereHas('adviserAssignment.adviser', function ($adviserQuery) use ($term) {
                                    $adviserQuery
                                        ->where('first_name', 'like', '%'.$term.'%')
                                        ->orWhere('last_name', 'like', '%'.$term.'%')
                                        ->orWhere('name', 'like', '%'.$term.'%');
                                });
                            }
                        });
                    })
                    ->orderByDesc('created_at')
                    ->paginate(10)
                    ->withQueryString();

                $groups = $groupsQuery
                    ->getCollection()
                    ->map(function (\App\Models\Group $group) use ($resolveUserName, $hasGroupPanelistTable): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $adviserName = $resolveUserName($group->adviserAssignment?->adviser);
                        $panelists = $hasGroupPanelistTable && $group->relationLoaded('panelAssignments')
                            ? $group->panelAssignments
                                ->sortBy('panel_slot')
                                ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                                    $panelist = $assignment->panelist;
                                    $panelistName = $resolveUserName($panelist);

                                    return [
                                        'id' => $panelist?->id,
                                        'name' => $panelistName !== '' ? $panelistName : null,
                                    ];
                                })
                                ->values()
                                ->all()
                            : [];

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program_set_id' => $group->program_set_id,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'adviser_name' => $adviserName !== '' ? $adviserName : null,
                            'members_count' => $group->members_count ?? 0,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();

                $pagination = [
                    'current_page' => $groupsQuery->currentPage(),
                    'last_page' => $groupsQuery->lastPage(),
                    'per_page' => $groupsQuery->perPage(),
                    'total' => $groupsQuery->total(),
                ];
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        return Inertia::render('Admin/monitoring/groups', [
            'groups' => $groups,
            'academicYears' => $academicYears,
            'programOptions' => $programOptions,
            'programSets' => $programSets,
            'filters' => [
                'search' => $filters['search'],
                'program' => $filters['program'] !== '' ? $filters['program'] : 'All',
                'academic_year' => $filters['academic_year'] !== '' ? $filters['academic_year'] : 'All',
                'program_set' => $filters['program_set'] !== '' ? $filters['program_set'] : 'All',
            ],
            'pagination' => $pagination,
        ]);
    })->name('admin.monitoring.groups');
    Route::get('/monitoring/panelists', function () {
        $academicYears = [];
        $panelists = [];
        $pagination = [
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 10,
            'total' => 0,
        ];
        $filters = [
            'search' => request()->string('search')->toString(),
        ];

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
                $panelistsQuery = User::query()
                    ->when($hasRoleTables, function ($query) {
                        $query->where(function ($roleQuery) {
                            $roleQuery->where('role', 'like', '%panelist%')
                                ->orWhereHas('roles', fn ($subQuery) => $subQuery->where('slug', 'panelist'));
                        });
                    }, function ($query) {
                        $query->where('role', 'like', '%panelist%');
                    })
                    ->when($filters['search'] !== '', function ($query) use ($filters) {
                        $term = $filters['search'];

                        $query->where(function ($subQuery) use ($term) {
                            $subQuery
                                ->where('first_name', 'like', '%'.$term.'%')
                                ->orWhere('last_name', 'like', '%'.$term.'%')
                                ->orWhere('name', 'like', '%'.$term.'%')
                                ->orWhere('email', 'like', '%'.$term.'%');
                        });
                    })
                    ->orderBy('last_name');

                $panelistsPaginator = $panelistsQuery
                    ->paginate(10)
                    ->withQueryString();

                if (Schema::hasTable('group_panelists') && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                    $panelistsPaginator->getCollection()->load([
                        'panelGroups' => function ($query) {
                            $query->with('programSet.academicYear');
                        },
                    ]);
                }

                $panelists = $panelistsPaginator
                    ->getCollection()
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

                $pagination = [
                    'current_page' => $panelistsPaginator->currentPage(),
                    'last_page' => $panelistsPaginator->lastPage(),
                    'per_page' => $panelistsPaginator->perPage(),
                    'total' => $panelistsPaginator->total(),
                ];
            }
        } catch (\Throwable $e) {
            $panelists = [];
        }

        return Inertia::render('Admin/monitoring/panelists', [
            'panelists' => $panelists,
            'academicYears' => $academicYears,
            'filters' => [
                'search' => $filters['search'],
            ],
            'pagination' => $pagination,
        ]);
    })->name('admin.monitoring.panelists');
    Route::get('/monitoring/scheduling', function () {
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
                    ->map(function (\App\Models\DefenseSchedule $schedule) use ($resolveUserName): array {
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
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $schedules = [];
        }

        return Inertia::render('Admin/monitoring/scheduling', [
            'groups' => $groups,
            'rooms' => $rooms,
            'schedules' => $schedules,
        ]);
    })->name('admin.monitoring.scheduling');
    Route::get('/system-settings', [AdminSystemSettingsController::class, 'edit'])->name('admin.system-settings');
    Route::put('/system-settings', [AdminSystemSettingsController::class, 'update'])->name('admin.system-settings.update');
    Route::get('/audit-logs', function () {
        return Inertia::render('Admin/audit-logs');
    })->name('admin.audit-logs');

    Route::get('/project-repository', function () {
        return Inertia::render('Admin/project-repository');
    })->name('admin.repository');
    Route::get('/backup-restore', function () {
        return Inertia::render('Admin/backup-restore');
    })->name('admin.backup-restore');
});
