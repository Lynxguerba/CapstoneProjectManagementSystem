<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminSystemSettingsController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpdateAdviserPasswordController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\AssignGroupAdviserController;
use App\Http\Controllers\AssignGroupPanelistController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BulkEnrollStudentsController;
use App\Http\Controllers\EnrollStudentController;
use App\Http\Controllers\StoreDefenseRoomController;
use App\Http\Controllers\UnenrollStudentController;
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

//
Route::get('/', function () {
    if (Auth::guard('web')->check()) {
        $user = Auth::guard('web')->user();

        if ($user !== null) {
            $routeName = (string) $user->role.'.dashboard';

            if (Route::has($routeName)) {
                return redirect()->route($routeName);
            }
        }
    }

    return Inertia::render('login');
})->name('login');

Route::get('/login', function () {
    return redirect()->route('login');
})->name('login.show');

Route::post('/login', [LoginController::class, 'store'])->name('login.store');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
Route::post('/switch-role', \App\Http\Controllers\Auth\SwitchRoleController::class)
    ->name('switch-role')
    ->middleware('auth');

// ADMIN ROUTES (protected)
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/students', [AdminUserController::class, 'students'])->name('admin.users.students');
    Route::get('/users/faculty', [AdminUserController::class, 'faculty'])->name('admin.users.faculty');
    Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::post('/users/bulk', [AdminUserController::class, 'bulkStore'])->name('admin.users.bulk-store');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
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

// INSTRUCTOR ROUTES (protected)
Route::middleware(['auth', 'role:instructor'])->prefix('instructor')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Instructor/dashboard');
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
        $group->load(['programSet.academicYear', 'leader']);

        if ($userId !== null && $group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $hasStudentProgramTable = Schema::hasTable('student_program');
        $group->load([
            'members' => function ($query) use ($hasStudentProgramTable) {
                if ($hasStudentProgramTable) {
                    $query->with(['studentProgram:id,student_id,program']);
                }
            },
        ]);

        $leader = $group->leader;
        $leaderName = $leader
            ? trim(collect([$leader->first_name ?? '', $leader->last_name ?? ''])->filter()->join(' '))
            : '';
        if ($leaderName === '' && $leader) {
            $leaderName = (string) $leader->name;
        }

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

        return response()->json([
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'program' => $group->programSet?->program,
                'school_year' => $group->programSet?->academicYear?->label,
                'leader_name' => $leaderName,
            ],
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
                    ->with(['programSet.academicYear', 'leader'])
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
                    ->get(['id', 'name', 'capacity', 'is_active'])
                    ->map(fn (\App\Models\DefenseRoom $room): array => [
                        'id' => $room->id,
                        'name' => $room->name,
                        'capacity' => $room->capacity,
                        'is_active' => $room->is_active,
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
                    ->with(['group.programSet.academicYear', 'group.panelAssignments.panelist', 'room'])
                    ->when($userId !== null, function ($query) use ($userId) {
                        $query->whereHas('group.programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->get()
                    ->map(function (\App\Models\DefenseSchedule $schedule) use ($resolveUserName): array {
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

        return Inertia::render('Instructor/scheduling', [
            'groups' => $groups,
            'rooms' => $rooms,
            'schedules' => $schedules,
        ]);
    })->name('instructor.scheduling');
    Route::post('/defense-rooms', StoreDefenseRoomController::class)->name('instructor.defense-rooms.store');
    Route::post('/defense-schedules', UpsertDefenseScheduleController::class)->name('instructor.defense-schedules.upsert');
    Route::patch('/defense-schedules/{schedule}/status', UpdateDefenseScheduleStatusController::class)
        ->name('instructor.defense-schedules.status');
    Route::get('/titles', function () {
        return Inertia::render('Instructor/titles');
    })->name('instructor.titles');
    Route::get('/concepts', function () {
        return Inertia::render('Instructor/concepts');
    })->name('instructor.concepts');

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

// STUDENT ROUTES (protected)
Route::middleware(['auth', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Student/dashboard');
    })->name('student.dashboard');
    Route::get('/group', function () {
        return Inertia::render('Student/group');
    })->name('student.group');
    Route::get('/titles', function () {
        return Inertia::render('Student/titles');
    })->name('student.titles');
    Route::get('/concepts', function () {
        return Inertia::render('Student/concepts');
    })->name('student.concepts');
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

// ADVISER ROUTES (protected)
Route::middleware(['auth', 'role:adviser'])->prefix('adviser')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Adviser/dashboard');
    })->name('adviser.dashboard');
    Route::get('/groups', function () {
        return Inertia::render('Adviser/groups');
    })->name('adviser.groups');
    Route::get('/group-details', function () {
        return Inertia::render('Adviser/group-details');
    })->name('adviser.group-details');
    Route::get('/concepts', function () {
        return Inertia::render('Adviser/concepts');
    })->name('adviser.concepts');
    Route::get('/documents', function () {
        return Inertia::render('Adviser/documents');
    })->name('adviser.documents');
    Route::get('/evaluations', function () {
        return Inertia::render('Adviser/evaluations');
    })->name('adviser.evaluations');
    Route::get('/schedule', function () {
        return Inertia::render('Adviser/schedule');
    })->name('adviser.schedule');
    Route::get('/verdict', function () {
        return Inertia::render('Adviser/verdict');
    })->name('adviser.verdict');
    Route::get('/minutes', function () {
        return Inertia::render('Adviser/minutes');
    })->name('adviser.minutes');
    Route::get('/notifications', function () {
        return Inertia::render('Adviser/notifications');
    })->name('adviser.notifications');
    Route::get('/deadlines', function () {
        return Inertia::render('Adviser/deadlines');
    })->name('adviser.deadlines');
    Route::get('/reports', function () {
        return Inertia::render('Adviser/reports');
    })->name('adviser.reports');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Adviser/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('adviser.settings');
    Route::put('/settings/password', UpdateAdviserPasswordController::class)->name('adviser.settings.password.update');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('adviser.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('adviser.settings.e-signature.delete');
});

// PANELIST ROUTES (protected)
Route::middleware(['auth', 'role:panelist'])->prefix('panelist')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Panelist/dashboard');
    })->name('panelist.dashboard');
    Route::get('/assigned-groups', function () {
        return Inertia::render('Panelist/assigned-groups');
    })->name('panelist.assigned-groups');
    Route::get('/group-details', function () {
        return Inertia::render('Panelist/group-details');
    })->name('panelist.group-details');
    Route::get('/schedule', function () {
        return Inertia::render('Panelist/schedule');
    })->name('panelist.schedule');
    Route::get('/documents', function () {
        return Inertia::render('Panelist/documents/document-list');
    })->name('panelist.documents');
    Route::get('/documents/viewer', function () {
        return Inertia::render('Panelist/documents/document-viewer');
    })->name('panelist.documents.viewer');
    Route::get('/evaluation', function () {
        return Inertia::render('Panelist/evaluation/evaluation-form');
    })->name('panelist.evaluation');
    Route::get('/comments', function () {
        return Inertia::render('Panelist/comments/comments-dashboard');
    })->name('panelist.comments');
    Route::get('/verdict', function () {
        return Inertia::render('Panelist/verdict/verdict-recommendation');
    })->name('panelist.verdict');
    Route::get('/history', function () {
        return Inertia::render('Panelist/history/past-evaluations');
    })->name('panelist.history');
    Route::get('/notifications', function () {
        return Inertia::render('Panelist/notifications');
    })->name('panelist.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Panelist/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('panelist.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('panelist.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('panelist.settings.e-signature.delete');
});

// DEAN ROUTES (protected)
Route::middleware(['auth', 'role:dean'])->prefix('dean')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dean/dashboard');
    })->name('dean.dashboard');
    Route::get('/projects', function () {
        return Inertia::render('Dean/projects');
    })->name('dean.projects');
    Route::get('/project-details', function () {
        return Inertia::render('Dean/project-details');
    })->name('dean.project-details');
    Route::get('/students', function () {
        return Inertia::render('Dean/students');
    })->name('dean.students');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Dean/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('dean.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('dean.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('dean.settings.e-signature.delete');
    Route::get('/reports', function () {
        return Inertia::render('Dean/reports');
    })->name('dean.reports');
});

// PROGRAM CHAIRPERSON ROUTES (protected)
Route::middleware(['auth', 'role:program_chairperson'])->prefix('program_chairperson')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('ProgramChairperson/dashboard');
    })->name('program_chairperson.dashboard');
    Route::get('/pre-deployment-letters', function () {
        return Inertia::render('ProgramChairperson/pre-deployment-letters');
    })->name('program_chairperson.pre-deployment-letters');
    Route::get('/deployment-approval', function () {
        return Inertia::render('ProgramChairperson/deployment-approval');
    })->name('program_chairperson.deployment-approval');
    Route::get('/deployment-monitoring', function () {
        return Inertia::render('ProgramChairperson/deployment-monitoring');
    })->name('program_chairperson.deployment-monitoring');
    Route::get('/post-deployment-review', function () {
        return Inertia::render('ProgramChairperson/post-deployment-review');
    })->name('program_chairperson.post-deployment-review');
    Route::get('/document-approval', function () {
        return Inertia::render('ProgramChairperson/document-approval');
    })->name('program_chairperson.document-approval');
    Route::get('/deployment-history', function () {
        return Inertia::render('ProgramChairperson/deployment-history');
    })->name('program_chairperson.deployment-history');
    Route::get('/notifications', function () {
        return Inertia::render('ProgramChairperson/notifications');
    })->name('program_chairperson.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('ProgramChairperson/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('program_chairperson.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.delete');
});
