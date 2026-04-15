<?php

use App\Http\Controllers\Student\AdviserRequestController;
use App\Http\Controllers\Student\DestroyStudentConceptSubmissionController;
use App\Http\Controllers\Student\DestroyStudentDocumentSubmissionController;
use App\Http\Controllers\Student\ShowStudentConceptSubmissionController;
use App\Http\Controllers\Student\ShowStudentDocumentController;
use App\Http\Controllers\Student\StoreStudentConceptSubmissionController;
use App\Http\Controllers\Student\StudentConceptController;
use App\Http\Controllers\Student\StudentDashboardController;
use App\Http\Controllers\Student\StudentDocumentsController;
use App\Http\Controllers\Student\StudentGroupController;
use App\Http\Controllers\Student\StudentLiveDefenseController;
use App\Http\Controllers\Student\StudentTitleRepositoryController;
use App\Http\Controllers\Student\UpdateStudentConceptSubmissionController;
use App\Models\AcademicYear;
use App\Models\AdviserProgramUtility;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAcknowledgementReceipt;
use App\Models\GroupAdviserRequest;
use App\Models\GroupPanelist;
use App\Models\User;
use Carbon\Carbon;
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
    Route::get('/documents', StudentDocumentsController::class)->name('student.documents');
    Route::get('/documents/files/{type}/{id}', ShowStudentDocumentController::class)
        ->whereIn('type', ['submission', 'recommendation', 'minutes'])
        ->whereNumber('id')
        ->name('student.documents.show');
    Route::delete('/documents/submissions/{submission}', DestroyStudentDocumentSubmissionController::class)
        ->name('student.documents.submissions.destroy');
    Route::get('/schedule', function () {
        $studentId = Auth::guard('web')->id();

        $groupSummary = null;
        $adviserSummary = null;
        $panelists = [];
        $schedules = [];
        $conceptReadiness = null;

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

        $resolveRequirementStatus = static function (DocumentRequirement $requirement, ?DocumentSubmission $submission): string {
            if (! $submission instanceof DocumentSubmission) {
                return 'Missing';
            }

            if ($submission->status === 'Approved') {
                return 'Approved';
            }

            $requirementType = strtolower(trim((string) ($requirement->requirement_type ?? '')));

            if ($submission->status === 'Submitted' && str_contains($requirementType, 'recommendation')) {
                return 'Approved';
            }

            if ($submission->status === 'Revision Required' || $submission->adviser_status === 'Revision Required') {
                return 'Revise';
            }

            return 'For Review';
        };

        try {
            if (class_exists(Group::class) && Schema::hasTable('groups') && $studentId !== null) {
                $hasGroupMembersTable = Schema::hasTable('group_members');

                $group = Group::query()
                    ->with([
                        'programSet.academicYear',
                        'adviserAssignment.adviser:id,name,first_name,last_name,email',
                        'panelAssignments.panelist:id,name,first_name,last_name,email',
                    ])
                    ->where(function (Builder $query) use ($studentId, $hasGroupMembersTable): void {
                        $query->where('leader_id', $studentId);

                        if ($hasGroupMembersTable) {
                            $query->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                                $memberQuery->where('users.id', $studentId);
                            });
                        }
                    })
                    ->first();

                if ($group instanceof Group) {
                    $programSet = $group->programSet;
                    $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                    $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                    $conceptVerdict = null;

                    if (Schema::hasColumn('groups', 'concept_verdict')) {
                        $rawConceptVerdict = is_string($group->concept_verdict) ? trim($group->concept_verdict) : '';
                        $conceptVerdict = $rawConceptVerdict !== '' ? $rawConceptVerdict : null;
                    }

                    $groupSummary = [
                        'id' => $group->id,
                        'name' => $group->name,
                        'program_set_name' => $programSet?->name ?: $fallbackName,
                        'program' => $programSet?->program,
                        'school_year' => $schoolYear,
                        'concept_verdict' => $conceptVerdict,
                    ];

                    $adviserUser = $group->adviserAssignment?->adviser;
                    if ($adviserUser instanceof User) {
                        $adviserName = $resolveUserName($adviserUser);

                        $adviserSummary = [
                            'id' => $adviserUser->id,
                            'name' => $adviserName !== '' ? $adviserName : null,
                            'email' => $adviserUser->email,
                        ];
                    }

                    $panelists = $group->panelAssignments
                        ->sortBy('panel_slot')
                        ->map(function (\App\Models\GroupPanelist $assignment) use ($resolveUserName): array {
                            $panelist = $assignment->panelist;
                            $panelistName = $resolveUserName($panelist);

                            return [
                                'id' => $panelist?->id,
                                'name' => $panelistName !== '' ? $panelistName : null,
                                'slot' => $assignment->panel_slot,
                                'email' => $panelist?->email,
                            ];
                        })
                        ->values()
                        ->all();

                    try {
                        if (class_exists(DefenseSchedule::class) && Schema::hasTable('defense_schedules')) {
                            $schedules = DefenseSchedule::query()
                                ->with('room:id,name,capacity,is_active,notes')
                                ->where('group_id', $group->id)
                                ->orderBy('scheduled_date')
                                ->orderBy('start_time')
                                ->get()
                                ->map(function (DefenseSchedule $schedule) use ($groupSummary, $panelists): array {
                                    return [
                                        'id' => $schedule->id,
                                        'group_id' => $groupSummary['id'],
                                        'group_name' => $groupSummary['name'],
                                        'program_set_name' => $groupSummary['program_set_name'],
                                        'program' => $groupSummary['program'],
                                        'school_year' => $groupSummary['school_year'],
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
                                        'panelists' => $panelists,
                                    ];
                                })
                                ->values()
                                ->all();
                        }
                    } catch (\Throwable $e) {
                        $schedules = [];
                    }

                    try {
                        if (
                            class_exists(DocumentRequirement::class)
                            && class_exists(DocumentSubmission::class)
                            && Schema::hasTable('document_requirements')
                            && Schema::hasTable('document_submissions')
                        ) {
                            $groupSchoolYear = trim((string) ($schoolYear ?? ''));

                            $requirements = DocumentRequirement::query()
                                ->with('academicYear')
                                ->where('stage', 'Concept')
                                ->orderBy('id')
                                ->get(['id', 'requirement_type', 'academic_year_id']);

                            $applicableRequirements = $requirements
                                ->filter(static function (DocumentRequirement $requirement) use ($groupSchoolYear): bool {
                                    $requirementSchoolYear = trim((string) ($requirement->academicYear?->label ?? ''));

                                    if ($requirementSchoolYear === '') {
                                        return true;
                                    }

                                    if ($groupSchoolYear === '') {
                                        return false;
                                    }

                                    return $groupSchoolYear === $requirementSchoolYear;
                                })
                                ->values();

                            if ($applicableRequirements->isEmpty()) {
                                $conceptReadiness = [
                                    'status' => 'Approved',
                                    'approved' => true,
                                    'requirements' => [],
                                    'latest_submitted_at' => null,
                                ];
                            } else {
                                $latestSubmissionsByRequirement = DocumentSubmission::query()
                                    ->where('group_id', $group->id)
                                    ->whereIn('document_requirement_id', $applicableRequirements->pluck('id')->all())
                                    ->orderByDesc('created_at')
                                    ->orderByDesc('id')
                                    ->get([
                                        'id',
                                        'document_requirement_id',
                                        'file_name',
                                        'status',
                                        'adviser_status',
                                        'created_at',
                                    ])
                                    ->unique('document_requirement_id')
                                    ->keyBy('document_requirement_id');

                                $requirementRows = $applicableRequirements->map(
                                    static function (DocumentRequirement $requirement) use ($latestSubmissionsByRequirement, $resolveRequirementStatus): array {
                                        /** @var DocumentSubmission|null $submission */
                                        $submission = $latestSubmissionsByRequirement->get($requirement->id);
                                        $requirementType = (string) ($requirement->requirement_type ?? '');
                                        $status = $resolveRequirementStatus(
                                            $requirement,
                                            $submission instanceof DocumentSubmission ? $submission : null
                                        );

                                        return [
                                            'id' => $requirement->id,
                                            'requirement_type' => $requirementType,
                                            'is_recommendation' => str_contains(strtolower($requirementType), 'recommendation'),
                                            'status' => $status,
                                            'submission' => $submission instanceof DocumentSubmission
                                                ? [
                                                    'id' => $submission->id,
                                                    'file_name' => $submission->file_name,
                                                    'status' => $submission->status,
                                                    'adviser_status' => $submission->adviser_status,
                                                    'submitted_at' => $submission->created_at?->format('Y-m-d H:i'),
                                                ]
                                                : null,
                                        ];
                                    }
                                );

                                $hasMissingRequirement = $requirementRows->contains(fn (array $row): bool => $row['status'] === 'Missing');
                                $hasRevisionRequirement = $requirementRows->contains(fn (array $row): bool => $row['status'] === 'Revise');
                                $allRequirementsApproved = $requirementRows->isNotEmpty()
                                    && $requirementRows->every(fn (array $row): bool => $row['status'] === 'Approved');

                                if ($hasMissingRequirement) {
                                    $overallStatus = 'Missing';
                                } elseif ($hasRevisionRequirement) {
                                    $overallStatus = 'Revise';
                                } elseif ($allRequirementsApproved) {
                                    $overallStatus = 'Approved';
                                } else {
                                    $overallStatus = 'For Review';
                                }

                                $latestSubmission = $latestSubmissionsByRequirement
                                    ->filter(fn ($submission): bool => $submission instanceof DocumentSubmission)
                                    ->sortByDesc(fn (DocumentSubmission $submission): int => $submission->created_at?->timestamp ?? 0)
                                    ->first();

                                $conceptReadiness = [
                                    'status' => $overallStatus,
                                    'approved' => $allRequirementsApproved,
                                    'requirements' => $requirementRows->values()->all(),
                                    'latest_submitted_at' => $latestSubmission instanceof DocumentSubmission
                                        ? $latestSubmission->created_at?->format('Y-m-d H:i')
                                        : null,
                                ];
                            }
                        }
                    } catch (\Throwable $e) {
                        $conceptReadiness = null;
                    }
                }
            }
        } catch (\Throwable $e) {
            $groupSummary = null;
            $adviserSummary = null;
            $panelists = [];
            $schedules = [];
            $conceptReadiness = null;
        }

        return Inertia::render('Student/schedule', [
            'group' => $groupSummary,
            'adviser' => $adviserSummary,
            'panelists' => $panelists,
            'schedules' => $schedules,
            'conceptReadiness' => $conceptReadiness,
        ]);
    })->name('student.schedule');
    Route::get('/browse-schedules', function () {
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
            if (class_exists(DefenseSchedule::class) && Schema::hasTable('defense_schedules')) {
                $schedules = DefenseSchedule::query()
                    ->with(['group.programSet.academicYear', 'group.panelAssignments.panelist', 'room'])
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->get()
                    ->map(function (DefenseSchedule $schedule) use ($resolveUserName): array {
                        $group = $schedule->group;
                        $programSet = $group?->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
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
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $schedules = [];
        }

        return Inertia::render('Student/browse-schedules', [
            'schedules' => $schedules,
        ]);
    })->name('student.browse-schedules');
    Route::get('/live-defense', StudentLiveDefenseController::class)->name('student.live-defense');
    Route::get('/live-defense/acknowledgement', function () {
        $studentId = Auth::guard('web')->id();
        $selectedGroupId = request()->query('group');
        $selectedGroupId = is_numeric($selectedGroupId) ? (int) $selectedGroupId : null;
        $hasGroupMembersTable = Schema::hasTable('group_members');

        if (
            $studentId === null
            || $selectedGroupId === null
            || ! class_exists(Group::class)
            || ! Schema::hasTable('groups')
        ) {
            abort(403);
        }

        $selectedGroup = Group::query()
            ->with([
                'programSet.academicYear',
                'programSet.instructor.eSignature',
                'leader:id,name,first_name,last_name',
                'members:id,name,first_name,last_name',
                'adviserAssignment.adviser.eSignature',
                'panelAssignments.panelist.eSignature',
            ])
            ->where('id', $selectedGroupId)
            ->where(function (Builder $query) use ($studentId, $hasGroupMembersTable): void {
                $query->where('leader_id', $studentId);

                if ($hasGroupMembersTable) {
                    $query->orWhereHas('members', fn (Builder $memberQuery): Builder => $memberQuery->where('users.id', $studentId));
                }
            })
            ->first();

        if (! $selectedGroup instanceof Group) {
            abort(403);
        }

        $resolveUserName = static function (?User $user): string {
            if (! $user instanceof User) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = trim($firstName.' '.$lastName);

            if ($fullName !== '') {
                return $fullName;
            }

            return is_string($user->name) ? trim($user->name) : '';
        };

        $resolveSignaturePayload = static function (?User $user): ?array {
            if (! $user instanceof User || ! $user->relationLoaded('eSignature') || $user->eSignature === null) {
                return null;
            }

            return [
                'signatureData' => $user->eSignature->signature_data,
                'mimeType' => $user->eSignature->mime_type,
            ];
        };

        $requestedStage = request()->query('stage');
        $requestedStage = is_string($requestedStage) && trim($requestedStage) !== '' ? trim($requestedStage) : null;
        $selectedSchedule = null;

        if (Schema::hasTable('defense_schedules')) {
            $baseScheduleQuery = DefenseSchedule::query()->where('group_id', $selectedGroup->id);

            if ($requestedStage !== null) {
                $selectedSchedule = (clone $baseScheduleQuery)
                    ->whereRaw('LOWER(stage) = ?', [strtolower($requestedStage)])
                    ->orderByRaw(
                        "CASE
                            WHEN status = 'Scheduled' THEN 0
                            WHEN status = 'Pending' THEN 1
                            WHEN status = 'Completed' THEN 2
                            ELSE 3
                        END"
                    )
                    ->orderByDesc('scheduled_date')
                    ->orderByDesc('start_time')
                    ->first(['id', 'group_id', 'stage', 'status', 'scheduled_date', 'start_time']);
            }

            if (! $selectedSchedule instanceof DefenseSchedule) {
                $selectedSchedule = (clone $baseScheduleQuery)
                    ->orderByRaw(
                        "CASE
                            WHEN status = 'Scheduled' THEN 0
                            WHEN status = 'Pending' THEN 1
                            WHEN status = 'Completed' THEN 2
                            ELSE 3
                        END"
                    )
                    ->orderByDesc('scheduled_date')
                    ->orderByDesc('start_time')
                    ->first(['id', 'group_id', 'stage', 'status', 'scheduled_date', 'start_time']);
            }
        }

        $resolvedStage = is_string($selectedSchedule?->stage) && trim($selectedSchedule->stage) !== ''
            ? trim($selectedSchedule->stage)
            : ($requestedStage ?? 'Concept');
        $normalizedStage = strtolower($resolvedStage);

        $defenseTypeKey = match ($normalizedStage) {
            'concept', 'concept paper', 'concept papers' => 'concept_presentation',
            'outline' => 'outline_defense',
            'pre-deployment', 'pre deployment' => 'pre_deployment_defense',
            'final', 'final defense', 'finals' => 'final_defense',
            default => 'concept_presentation',
        };

        $defenseDateLabel = $selectedSchedule?->scheduled_date?->format('F d, Y') ?? now()->format('F d, Y');
        $defenseTimeLabel = 'TBD';
        if (is_string($selectedSchedule?->start_time) && trim($selectedSchedule->start_time) !== '') {
            $startTime = Carbon::createFromFormat('H:i:s', $selectedSchedule->start_time);
            $defenseTimeLabel = $startTime !== false ? $startTime->format('g:i A') : $selectedSchedule->start_time;
        }

        $projectLeader = $resolveUserName($selectedGroup->leader);
        $memberNames = $selectedGroup->members
            ->map(fn (User $member): string => $resolveUserName($member))
            ->filter(fn (string $name): bool => $name !== '')
            ->values()
            ->all();

        $dateReceivedLabel = now()->format('F d, Y');
        $receiptRowsByFacultyUserId = collect();
        if (Schema::hasTable('group_acknowledgement_receipts')) {
            $receiptRowsByFacultyUserId = GroupAcknowledgementReceipt::query()
                ->where('group_id', $selectedGroup->id)
                ->where('defense_type_key', $defenseTypeKey)
                ->get([
                    'id',
                    'faculty_user_id',
                    'faculty_role',
                    'amount_received',
                    'date_received',
                    'signed_at',
                ])
                ->keyBy('faculty_user_id');
        }

        $resolveDateReceivedLabel = static function (mixed $value, string $fallback): string {
            if ($value instanceof \DateTimeInterface) {
                return Carbon::instance($value)->format('F d, Y');
            }

            if (is_string($value) && trim($value) !== '') {
                try {
                    return Carbon::parse($value)->format('F d, Y');
                } catch (\Throwable $e) {
                    return $fallback;
                }
            }

            return $fallback;
        };

        $formatAmountLabel = static function (mixed $amount, int $fallback): string {
            $resolvedAmount = is_numeric($amount) ? (int) $amount : $fallback;

            return 'P '.number_format($resolvedAmount, 0);
        };

        $facultyRows = collect();
        $adviser = $selectedGroup->adviserAssignment?->adviser;
        if ($adviser instanceof User) {
            $receiptRow = $receiptRowsByFacultyUserId->get($adviser->id);
            $facultyRows->push([
                'id' => 'adviser-'.$adviser->id,
                'userId' => $adviser->id,
                'name' => strtoupper($resolveUserName($adviser)),
                'role' => is_string($receiptRow?->faculty_role) && trim($receiptRow->faculty_role) !== '' ? $receiptRow->faculty_role : 'ADVISER',
                'amountReceived' => $formatAmountLabel($receiptRow?->amount_received, 500),
                'dateReceived' => $resolveDateReceivedLabel($receiptRow?->date_received, $dateReceivedLabel),
                'signedAt' => $receiptRow?->signed_at?->toIso8601String(),
                'eSignature' => $resolveSignaturePayload($adviser),
            ]);
        }

        $selectedGroup->panelAssignments
            ->sortBy('panel_slot')
            ->each(function (GroupPanelist $assignment) use (
                $facultyRows,
                $resolveUserName,
                $resolveSignaturePayload,
                $dateReceivedLabel,
                $receiptRowsByFacultyUserId,
                $resolveDateReceivedLabel,
                $formatAmountLabel
            ): void {
                $panelist = $assignment->panelist;
                if (! $panelist instanceof User) {
                    return;
                }

                $receiptRow = $receiptRowsByFacultyUserId->get($panelist->id);
                $roleValue = strtolower(trim((string) $assignment->role));
                $roleLabel = is_string($receiptRow?->faculty_role) && trim($receiptRow->faculty_role) !== ''
                    ? trim($receiptRow->faculty_role)
                    : (($roleValue === 'chairman' || (int) $assignment->panel_slot === 1)
                    ? 'PANEL CHAIRMAN'
                    : 'PANEL MEMBER');

                $facultyRows->push([
                    'id' => 'panel-'.$panelist->id,
                    'userId' => $panelist->id,
                    'name' => strtoupper($resolveUserName($panelist)),
                    'role' => $roleLabel,
                    'amountReceived' => $formatAmountLabel($receiptRow?->amount_received, 300),
                    'dateReceived' => $resolveDateReceivedLabel($receiptRow?->date_received, $dateReceivedLabel),
                    'signedAt' => $receiptRow?->signed_at?->toIso8601String(),
                    'eSignature' => $resolveSignaturePayload($panelist),
                ]);
            });

        $instructor = $selectedGroup->programSet?->instructor;

        return Inertia::render('Student/live-defense/acknowledgement-receipt', [
            'group' => [
                'id' => $selectedGroup->id,
                'name' => (string) $selectedGroup->name,
                'programSetName' => $selectedGroup->programSet?->program,
                'academicYear' => $selectedGroup->programSet?->academicYear?->label ?? $selectedGroup->programSet?->school_year,
            ],
            'defense' => [
                'typeKey' => $defenseTypeKey,
                'program' => strtoupper(trim((string) ($selectedGroup->programSet?->program ?? ''))),
                'dateLabel' => $defenseDateLabel,
                'timeLabel' => $defenseTimeLabel,
            ],
            'project' => [
                'leaderName' => $projectLeader,
                'memberNames' => $memberNames,
            ],
            'facultyRows' => $facultyRows->values()->all(),
            'instructor' => [
                'name' => $resolveUserName($instructor),
                'eSignature' => $resolveSignaturePayload($instructor),
            ],
        ]);
    })->name('student.live-defense.acknowledgement');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        if (!$user instanceof User) {
            abort(403);
        }

        $programSet = $user->programSets()->with('academicYear')->first();
        
        $groupRole = 'Student';
        if (Schema::hasTable('groups')) {
            $group = Group::query()
                ->where('leader_id', $user->id)
                ->orWhereHas('members', function (Builder $query) use ($user) {
                    $query->where('users.id', $user->id);
                })
                ->first();

            if ($group) {
                if ((int) $group->leader_id === (int) $user->id) {
                    $groupRole = 'Group Leader';
                } else if (Schema::hasTable('group_members')) {
                    $member = $group->members()->where('users.id', $user->id)->first();
                    if ($member && $member->pivot && is_string($member->pivot->role) && trim($member->pivot->role) !== '') {
                        $groupRole = trim($member->pivot->role);
                    } else {
                        $groupRole = 'Member';
                    }
                } else {
                    $groupRole = 'Member';
                }
            }
        }

        return Inertia::render('Student/settings', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'program' => $user->program,
                    'section' => $programSet?->name,
                    'groupRole' => $groupRole,
                ],
            ],
        ]);
    })->name('student.settings');
    Route::put('/settings/password', \App\Http\Controllers\Student\UpdateStudentPasswordController::class)->name('student.settings.password.update');
});
