<?php

use App\Http\Controllers\Student\AdviserRequestController;
use App\Http\Controllers\Student\DestroyStudentConceptSubmissionController;
use App\Http\Controllers\Student\ShowStudentConceptSubmissionController;
use App\Http\Controllers\Student\StoreStudentConceptSubmissionController;
use App\Http\Controllers\Student\StudentConceptController;
use App\Http\Controllers\Student\StudentDashboardController;
use App\Http\Controllers\Student\StudentGroupController;
use App\Http\Controllers\Student\StudentTitleRepositoryController;
use App\Http\Controllers\Student\UpdateStudentConceptSubmissionController;
use App\Models\AcademicYear;
use App\Models\AdviserProgramUtility;
use App\Models\Group;
use App\Models\GroupAdviserRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', StudentDashboardController::class)->name('student.dashboard');
    Route::get('/group', StudentGroupController::class)->name('student.group');
    Route::get('/adviser-selection', function () {
        $advisers = [];
        $academicYears = [];
        $groupSummary = null;
        $pendingRequest = null;
        $currentAdviser = null;

        $studentId = Auth::guard('web')->id();

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
            if (class_exists(Group::class) && Schema::hasTable('groups') && $studentId !== null) {
                $groupQuery = Group::query();
                $hasGroupMembersTable = Schema::hasTable('group_members');
                $hasProgramSetsTable = Schema::hasTable('program_sets');
                $hasAcademicYearsTable = Schema::hasTable('academic_years');

                if ($hasProgramSetsTable) {
                    $groupQuery->with('programSet');

                    if ($hasAcademicYearsTable) {
                        $groupQuery->with('programSet.academicYear');
                    }
                }

                if (Schema::hasTable('group_advisers')) {
                    $groupQuery->with('adviserAssignment.adviser');
                }

                $groupQuery->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
                    $groupQuery->where('leader_id', $studentId);

                    if ($hasGroupMembersTable) {
                        $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                            $memberQuery->where('users.id', $studentId);
                        });
                    }
                });

                $group = $groupQuery->first();

                if ($group) {
                    $groupSummary = [
                        'id' => $group->id,
                        'name' => $group->name,
                        'programSet' => $group->programSet?->name,
                        'academicYear' => $group->programSet?->academicYear?->label ?? $group->programSet?->school_year,
                    ];

                    $assignedAdviser = $group->adviserAssignment?->adviser;
                    if ($assignedAdviser instanceof User) {
                        $currentAdviser = [
                            'id' => $assignedAdviser->id,
                            'name' => $resolveUserName($assignedAdviser),
                        ];
                    }

                    if (Schema::hasTable('group_adviser_requests')) {
                        $pending = GroupAdviserRequest::query()
                            ->with('adviser:id,name,first_name,last_name')
                            ->where('group_id', $group->id)
                            ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
                            ->where('status', GroupAdviserRequest::STATUS_PENDING)
                            ->orderByDesc('created_at')
                            ->first(['id', 'group_id', 'adviser_id', 'created_at']);

                        if ($pending) {
                            $pendingRequest = [
                                'id' => $pending->id,
                                'adviser_id' => $pending->adviser_id,
                                'adviser_name' => $resolveUserName($pending->adviser),
                            ];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            $groupSummary = null;
        }

        try {
            if (Schema::hasTable('users')) {
                $hasRoleTables = Schema::hasTable('roles') && Schema::hasTable('role_user');

                $advisersQuery = User::query()
                    ->where(function (Builder $query) use ($hasRoleTables): void {
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
                    ->map(function (User $adviser) use ($resolveUserName): array {
                        $fullName = $resolveUserName($adviser);

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

        return Inertia::render('Student/concepts/adviser-selection', [
            'group' => $groupSummary,
            'currentAdviser' => $currentAdviser,
            'pendingRequest' => $pendingRequest,
            'advisers' => $advisers,
            'academicYears' => $academicYears,
        ]);
    })->name('student.adviser-selection');
    Route::post('/adviser-selection/requests', AdviserRequestController::class)->name('student.adviser-requests.store');
    Route::get('/titles', StudentTitleRepositoryController::class)->name('student.titles');
    Route::get('/concepts', StudentConceptController::class)->name('student.concepts');
    Route::post('/concepts/submissions', StoreStudentConceptSubmissionController::class)->name('student.concepts.submissions.store');
    Route::get('/concepts/submissions/{submission}', ShowStudentConceptSubmissionController::class)->name('student.concepts.submissions.show');
    Route::patch('/concepts/submissions/{submission}', UpdateStudentConceptSubmissionController::class)->name('student.concepts.submissions.update');
    Route::delete('/concepts/submissions/{submission}', DestroyStudentConceptSubmissionController::class)->name('student.concepts.submissions.destroy');
    Route::get('/documents', function () {
        return Inertia::render('Student/documents');
    })->name('student.documents');
    Route::get('/schedule', function () {
        return Inertia::render('Student/schedule');
    })->name('student.schedule');
    Route::get('/evaluation', function () {
        return Inertia::render('Student/evaluation');
    })->name('student.evaluation');
    Route::get('/verdict', function () {
        return Inertia::render('Student/verdict');
    })->name('student.verdict');
    Route::get('/deployment', function () {
        return Inertia::render('Student/deployment');
    })->name('student.deployment');
    Route::get('/deadlines', function () {
        return Inertia::render('Student/deadlines');
    })->name('student.deadlines');
    Route::get('/settings', function () {
        return Inertia::render('Student/settings');
    })->name('student.settings');
});
