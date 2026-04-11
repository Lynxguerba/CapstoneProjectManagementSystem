<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\StoreBulkAdminUsersRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Jobs\ProcessBulkUserImport;
use App\Models\Role;
use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const ENTITY_TYPES = [
        'user',
        'faculty',
        'student',
    ];

    /**
     * @var array<int, string>
     */
    private const FACULTY_ASSIGNABLE_ROLES = [
        'admin',
        'adviser',
        'panelist',
        'instructor',
        'dean',
        'program_chairperson',
    ];

    private ?bool $hasStudentProgramTableCache = null;

    private ?bool $hasUsersProgramColumnCache = null;

    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'role' => $request->string('role')->toString(),
        ];

        $users = User::query()
            ->with('roles:id,slug')
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $query->where(function (Builder $innerQuery) use ($filters) {
                    $innerQuery
                        ->where('first_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['role'] !== '' && $filters['role'] !== 'all', function (Builder $query) use ($filters) {
                $query->whereHas('roles', function (Builder $roleQuery) use ($filters) {
                    $roleQuery->where('slug', $filters['role']);
                });
            })
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at'])
            ->map(function (User $user): array {
                $roleSlugs = $user->roleSlugs();
                $role = is_string($user->role) && $user->role !== ''
                    ? $user->role
                    : ($roleSlugs[0] ?? 'student');
                $resolvedRoles = count($roleSlugs) > 0 ? $roleSlugs : [$role];
                $status = is_string($user->status) && $user->status !== '' ? $user->status : 'active';
                $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
                $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
                $fullName = $this->buildFullName($firstName, $lastName, $user->name);

                return [
                    'id' => $user->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $user->email,
                    'role' => $role,
                    'roles' => $resolvedRoles,
                    'status' => $status,
                    'createdAt' => $user->created_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values();

        return Inertia::render('Admin/user-management', [
            'users' => $users,
            'existingEmails' => $this->existingEmails(),
            'filters' => [
                'search' => $filters['search'],
                'role' => $filters['role'] !== '' ? $filters['role'] : 'all',
                'status' => 'all',
            ],
        ]);
    }

    public function store(StoreAdminUserRequest $request): RedirectResponse
    {
        $entityType = $this->resolveEntityType($request);
        $validated = $request->validated();

        if ($entityType === 'faculty') {
            $roles = collect($validated['roles'] ?? [])
                ->map(fn (string $role): ?string => Role::normalizeRole($role))
                ->filter(fn (?string $role): bool => is_string($role) && in_array($role, self::FACULTY_ASSIGNABLE_ROLES, true))
                ->filter()
                ->values();

            $activeRole = $roles->first() ?? 'adviser';
            $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);
            $programCode = $this->resolveProgramChairProgram($roles->all(), $validated['program'] ?? null);

            $userAttributes = [
                'name' => $name,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'role' => $activeRole,
                'status' => $validated['status'] ?? 'active',
                'password' => $validated['password'],
            ];

            if ($this->hasUsersProgramColumn()) {
                $userAttributes['program'] = $programCode;
            }

            $user = User::query()->create($userAttributes);

            $user->syncRoles($roles->all());

            return redirect()->route('admin.users.faculty')->with('success', 'Faculty account created successfully.');
        }

        if ($entityType === 'student') {
            $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);

            $user = User::query()->create([
                'name' => $name,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'role' => 'student',
                'status' => $validated['status'] ?? 'active',
                'password' => $validated['password'],
            ]);

            $user->syncRoles(['student']);
            $this->syncStudentProfile($user, $validated['program'], true);

            return redirect()->route('admin.users.students')->with('success', 'Student created successfully.');
        }

        $roles = collect($validated['roles'])
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter()
            ->values();

        $activeRole = $roles->first() ?? 'student';
        $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);
        $programCode = is_string($validated['program'] ?? null) ? $validated['program'] : null;

        $user = User::query()->create([
            'name' => $name,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'role' => $activeRole,
            'status' => $validated['status'] ?? 'active',
            'password' => $validated['password'],
        ]);

        $user->syncRoles($roles->all());
        $this->syncStudentProfile($user, $programCode, in_array('student', $roles->all(), true));

        return redirect()->route('admin.users.index')->with('success', 'User account created successfully.');
    }

    public function update(UpdateAdminUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $from = $request->string('from')->toString();

        $roles = collect($validated['roles'])
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter()
            ->values();

        if ($from === 'student') {
            $roles = collect(['student']);
        }

        if ($from === 'faculty') {
            $roles = $roles
                ->filter(fn (string $role): bool => in_array($role, self::FACULTY_ASSIGNABLE_ROLES, true))
                ->values();

            if ($roles->isEmpty()) {
                $roles = collect(['adviser']);
            }
        }

        $activeRole = $roles->first() ?? 'student';
        $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);

        $isStudent = in_array('student', $roles->all(), true);
        $programCode = is_string($validated['program'] ?? null)
            ? $validated['program']
            : $user->studentProgram?->program;
        $facultyProgramCode = $from === 'faculty'
            ? $this->resolveProgramChairProgram($roles->all(), $validated['program'] ?? null)
            : null;

        $userAttributes = [
            'name' => $name,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'role' => $activeRole,
            'status' => $validated['status'],
            'password' => is_string($validated['password'] ?? null) && $validated['password'] !== ''
                ? $validated['password']
                : $user->password,
        ];

        if ($from === 'faculty' && $this->hasUsersProgramColumn()) {
            $userAttributes['program'] = $facultyProgramCode;
        }

        $user->update($userAttributes);

        $user->syncRoles($roles->all());
        $this->syncStudentProfile($user, $programCode, $isStudent);

        if ($from === 'faculty') {
            return redirect()->route('admin.users.faculty')->with('success', 'User account updated successfully.');
        }

        if ($from === 'student') {
            return redirect()->route('admin.users.students')->with('success', 'Student account updated successfully.');
        }

        return redirect()->route('admin.users.index')->with('success', 'User account updated successfully.');
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        $roles = $user->roleSlugs();
        $isStudent = $user->hasRole('student') || Role::normalizeRole((string) $user->role) === 'student';
        $storedProgram = $this->hasUsersProgramColumn() ? $user->program : null;
        $programCode = $user->studentProgram?->program ?? $storedProgram;

        if ($isStudent && $this->normalizeProgramCode($programCode) === null) {
            return $this->redirectToListing($request, 'Assign a valid program before approving this student account.', true);
        }

        $user->forceFill([
            'status' => 'active',
        ])->save();

        if ($isStudent) {
            $this->syncStudentProfile($user, $programCode, true);
        }

        if ($user->role === '' || $user->role === null) {
            $user->forceFill([
                'role' => $roles[0] ?? ($isStudent ? 'student' : 'adviser'),
            ])->save();
        }

        return $this->redirectToListing($request, 'Account approved and activated successfully.');
    }

    public function reject(Request $request, User $user): RedirectResponse
    {
        $user->forceFill([
            'status' => 'inactive',
        ])->save();

        return $this->redirectToListing($request, 'Account request rejected successfully.');
    }

    public function bulkStore(StoreBulkAdminUsersRequest $request): RedirectResponse|JsonResponse
    {
        $entityType = $this->resolveEntityType($request);
        $validated = $request->validated();

        if ($request->expectsJson()) {
            $this->extendExecutionTimeForBulkImport();

            $importId = (string) Str::uuid();
            $queueConnection = $this->resolveBulkImportQueueConnection();
            $progress = [
                'import_id' => $importId,
                'requested_by' => $request->user()?->id,
                'type' => $entityType,
                'status' => 'queued',
                'total_rows' => count($validated['rows']),
                'processed_rows' => 0,
                'successful_rows' => 0,
                'failed_rows' => 0,
                'progress_percentage' => 0,
                'message' => 'Import queued. Processing in the background...',
                'failed_items' => [],
                'cancel_requested' => false,
                'started_at' => null,
                'finished_at' => null,
                'updated_at' => now()->toIso8601String(),
            ];

            Cache::put($this->bulkImportCacheKey($importId), $progress, now()->addHours(12));

            ProcessBulkUserImport::dispatch(
                importId: $importId,
                requestedById: $request->user()?->id,
                entityType: $entityType,
                rows: $validated['rows']
            )->onConnection($queueConnection);

            return response()->json($progress, 202);
        }

        $this->extendExecutionTimeForBulkImport();
        $hasStudentProgramTable = $this->hasStudentProgramTable();
        $hasUsersProgramColumn = $this->hasUsersProgramColumn();
        $roleIdsBySlug = $this->roleIdsBySlug();

        $resolveRoleIds = function (array $roles) use ($roleIdsBySlug): array {
            return collect($roles)
                ->map(fn (string $role): ?string => Role::normalizeRole($role))
                ->filter(fn (?string $role): bool => is_string($role) && array_key_exists($role, $roleIdsBySlug))
                ->values()
                ->unique()
                ->map(fn (string $role): int => $roleIdsBySlug[$role])
                ->all();
        };

        if ($entityType === 'faculty') {
            collect($validated['rows'])->each(function (array $row) use ($hasUsersProgramColumn, $resolveRoleIds): void {
                $roles = collect($row['roles'] ?? [])
                    ->map(fn (string $role): ?string => Role::normalizeRole($role))
                    ->filter(fn (?string $role): bool => is_string($role) && in_array($role, self::FACULTY_ASSIGNABLE_ROLES, true))
                    ->filter()
                    ->values();

                $activeRole = $roles->first() ?? 'adviser';
                $name = $this->buildDisplayName($row['first_name'], $row['last_name']);
                $programCode = $this->resolveProgramChairProgram($roles->all(), $row['program'] ?? null);

                $userAttributes = [
                    'name' => $name,
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'role' => $activeRole,
                    'status' => 'active',
                    'password' => (string) $row['password'],
                ];

                if ($hasUsersProgramColumn) {
                    $userAttributes['program'] = $programCode;
                }

                $user = User::query()->create($userAttributes);

                $resolvedRoles = $roles->isNotEmpty() ? $roles->all() : [$activeRole];
                $roleIds = $resolveRoleIds($resolvedRoles);

                if (count($roleIds) > 0) {
                    $user->roles()->attach($roleIds);
                } else {
                    $user->syncRoles($resolvedRoles);
                }
            });

            return redirect()->route('admin.users.faculty')->with('success', 'Faculty users uploaded successfully.');
        }

        if ($entityType === 'student') {
            $studentRoleId = $roleIdsBySlug['student'] ?? null;

            collect($validated['rows'])->each(function (array $row) use ($hasStudentProgramTable, $studentRoleId): void {
                $name = $this->buildDisplayName($row['first_name'], $row['last_name']);

                $user = User::query()->create([
                    'name' => $name,
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'role' => 'student',
                    'status' => 'active',
                    'password' => $row['password'],
                ]);

                if ($studentRoleId !== null) {
                    $user->roles()->attach([$studentRoleId]);
                } else {
                    $user->syncRoles(['student']);
                }

                $this->syncStudentProfile($user, $row['program'], true, $hasStudentProgramTable);
            });

            return redirect()->route('admin.users.students')->with('success', 'Students uploaded successfully.');
        }

        collect($validated['rows'])->each(function (array $row) use ($hasStudentProgramTable, $resolveRoleIds): void {
            $roles = collect($row['roles'])
                ->map(fn (string $role): ?string => Role::normalizeRole($role))
                ->filter()
                ->values();

            $activeRole = $roles->first() ?? 'student';
            $name = $this->buildDisplayName($row['first_name'], $row['last_name']);

            $user = User::query()->create([
                'name' => $name,
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'],
                'role' => $activeRole,
                'status' => 'active',
                'password' => $row['password'],
            ]);

            $resolvedRoles = $roles->isNotEmpty() ? $roles->all() : [$activeRole];
            $roleIds = $resolveRoleIds($resolvedRoles);

            if (count($roleIds) > 0) {
                $user->roles()->attach($roleIds);
            } else {
                $user->syncRoles($resolvedRoles);
            }

            $this->syncStudentProfile($user, $row['program'] ?? null, in_array('student', $resolvedRoles, true), $hasStudentProgramTable);
        });

        return redirect()->route('admin.users.index')->with('success', 'Users uploaded successfully.');
    }

    public function bulkStatus(Request $request, string $importId): JsonResponse
    {
        $progress = Cache::get($this->bulkImportCacheKey($importId));

        if (! is_array($progress)) {
            return response()->json([
                'message' => 'Bulk import progress not found or has expired.',
            ], 404);
        }

        $requestedBy = $progress['requested_by'] ?? null;
        $authenticatedUserId = $request->user()?->id;

        if ($requestedBy !== null && $authenticatedUserId !== null && (int) $requestedBy !== (int) $authenticatedUserId) {
            return response()->json([
                'message' => 'You are not authorized to view this import progress.',
            ], 403);
        }

        return response()->json($progress);
    }

    public function bulkCancel(Request $request, string $importId): JsonResponse
    {
        $progress = Cache::get($this->bulkImportCacheKey($importId));

        if (! is_array($progress)) {
            return response()->json([
                'message' => 'Bulk import progress not found or has expired.',
            ], 404);
        }

        $requestedBy = $progress['requested_by'] ?? null;
        $authenticatedUserId = $request->user()?->id;

        if ($requestedBy !== null && $authenticatedUserId !== null && (int) $requestedBy !== (int) $authenticatedUserId) {
            return response()->json([
                'message' => 'You are not authorized to cancel this import.',
            ], 403);
        }

        $status = is_string($progress['status'] ?? null) ? $progress['status'] : 'queued';
        if (in_array($status, ['completed', 'failed', 'cancelled'], true)) {
            return response()->json($progress);
        }

        $progress['cancel_requested'] = true;
        $progress['message'] = 'Import cancellation requested. Stopping after current row.';
        $progress['updated_at'] = now()->toIso8601String();

        if ($status === 'queued') {
            $progress['status'] = 'cancelled';
            $progress['message'] = 'Import cancelled before processing started.';
            $progress['finished_at'] = now()->toIso8601String();
        }

        Cache::put($this->bulkImportCacheKey($importId), $progress, now()->addHours(12));

        return response()->json($progress);
    }

    public function students(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
        ];
        $hasStudentProgramTable = $this->hasStudentProgramTable();

        $studentsQuery = User::query()
            ->where(function (Builder $query): void {
                $query
                    ->where('role', 'student')
                    ->orWhereHas('roles', function (Builder $roleQuery): void {
                        $roleQuery->where('slug', 'student');
                    });
            });

        if ($hasStudentProgramTable) {
            $studentsQuery
                ->with(['roles:id,slug', 'studentProgram:id,student_id,program'])
                ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                    $query->where(function (Builder $innerQuery) use ($filters): void {
                        $innerQuery
                            ->where('first_name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('email', 'like', '%'.$filters['search'].'%')
                            ->orWhereHas('studentProgram', function (Builder $programQuery) use ($filters): void {
                                $programQuery->where('program', 'like', '%'.$filters['search'].'%');
                            });
                    });
                });
        } else {
            $studentsQuery
                ->with('roles:id,slug')
                ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                    $query->where(function (Builder $innerQuery) use ($filters): void {
                        $innerQuery
                            ->where('first_name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('email', 'like', '%'.$filters['search'].'%');
                    });
                });
        }

        $students = $studentsQuery
            ->orderByRaw("CASE WHEN users.status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('users.created_at')
            ->get($this->studentListingColumns())
            ->map(function (User $student) use ($hasStudentProgramTable): array {
                $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                $fullName = $this->buildFullName($firstName, $lastName, $student->name);
                $status = is_string($student->status) && $student->status !== '' ? $student->status : 'active';
                $storedProgram = $this->hasUsersProgramColumn() ? $student->program : null;
                $program = $hasStudentProgramTable
                    ? ($student->studentProgram?->program ?? $this->normalizeProgramCode($storedProgram))
                    : $this->normalizeProgramCode($storedProgram);

                return [
                    'id' => $student->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $student->email,
                    'program' => $program,
                    'status' => $status,
                    'createdAt' => $student->created_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values();

        return Inertia::render('Admin/students', [
            'students' => $students,
            'existingEmails' => $this->existingEmails(),
            'filters' => [
                'search' => $filters['search'],
            ],
        ]);
    }

    public function faculty(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'role' => $request->string('role')->toString(),
        ];

        $facultyRoles = self::FACULTY_ASSIGNABLE_ROLES;
        $facultyColumns = ['id', 'name', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at'];

        if ($this->hasUsersProgramColumn()) {
            $facultyColumns[] = 'program';
        }

        $faculties = User::query()
            ->with('roles:id,slug')
            ->where(function (Builder $query) use ($facultyRoles) {
                $query
                    ->whereIn('role', $facultyRoles)
                    ->orWhereHas('roles', function (Builder $roleQuery) use ($facultyRoles) {
                        $roleQuery->whereIn('slug', $facultyRoles);
                    });
            })
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $query->where(function (Builder $innerQuery) use ($filters) {
                    $innerQuery
                        ->where('first_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['role'] !== '' && $filters['role'] !== 'all' && in_array($filters['role'], $facultyRoles, true), function (Builder $query) use ($filters) {
                $query->where(function (Builder $innerQuery) use ($filters) {
                    $innerQuery
                        ->where('role', $filters['role'])
                        ->orWhereHas('roles', function (Builder $roleQuery) use ($filters) {
                            $roleQuery->where('slug', $filters['role']);
                        });
                });
            })
            ->orderByRaw("CASE WHEN users.status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('users.created_at')
            ->get($facultyColumns)
            ->map(function (User $user) use ($facultyRoles): array {
                $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
                $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
                $fullName = $this->buildFullName($firstName, $lastName, $user->name);
                $roleSlugs = collect($user->roleSlugs())
                    ->filter(fn (string $role): bool => in_array($role, $facultyRoles, true))
                    ->values()
                    ->all();
                $fallbackRole = is_string($user->role) && in_array($user->role, $facultyRoles, true)
                    ? $user->role
                    : 'adviser';
                $resolvedRoles = count($roleSlugs) > 0 ? $roleSlugs : [$fallbackRole];
                $status = is_string($user->status) && $user->status !== '' ? $user->status : 'active';
                $program = $this->hasUsersProgramColumn()
                    ? $this->normalizeProgramCode($user->program)
                    : null;

                return [
                    'id' => $user->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $user->email,
                    'role' => $resolvedRoles[0],
                    'roles' => $resolvedRoles,
                    'status' => $status,
                    'program' => $program,
                    'createdAt' => $user->created_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values();

        return Inertia::render('Admin/faculty', [
            'faculties' => $faculties,
            'existingEmails' => $this->existingEmails(),
            'filters' => [
                'search' => $filters['search'],
                'role' => $filters['role'] !== '' ? $filters['role'] : 'all',
            ],
        ]);
    }

    private function normalizeProgramCode(mixed $programCode): ?string
    {
        if (! is_string($programCode) || trim($programCode) === '') {
            return null;
        }

        $normalizedCode = strtoupper(trim($programCode));

        if (! in_array($normalizedCode, ['BSIT', 'BSIS'], true)) {
            return null;
        }

        return $normalizedCode;
    }

    /**
     * @param  array<int, string>  $roles
     */
    private function resolveProgramChairProgram(array $roles, mixed $programCode): ?string
    {
        if (! in_array('program_chairperson', $roles, true)) {
            return null;
        }

        return $this->normalizeProgramCode($programCode);
    }

    private function syncStudentProfile(User $user, ?string $programCode, bool $isStudent, ?bool $hasStudentProgramTable = null): void
    {
        $studentProgramTableExists = $hasStudentProgramTable ?? $this->hasStudentProgramTable();

        if (! $studentProgramTableExists) {
            return;
        }

        if (! $isStudent) {
            $user->studentProgram()->delete();

            return;
        }

        $resolvedProgram = $this->normalizeProgramCode($programCode);

        if ($resolvedProgram === null) {
            $user->studentProgram()->delete();

            return;
        }

        StudentProgram::query()->updateOrCreate(
            ['student_id' => $user->id],
            ['program' => $resolvedProgram]
        );
    }

    private function hasStudentProgramTable(): bool
    {
        if ($this->hasStudentProgramTableCache !== null) {
            return $this->hasStudentProgramTableCache;
        }

        $this->hasStudentProgramTableCache = Schema::hasTable('student_program');

        return $this->hasStudentProgramTableCache;
    }

    private function hasUsersProgramColumn(): bool
    {
        if ($this->hasUsersProgramColumnCache !== null) {
            return $this->hasUsersProgramColumnCache;
        }

        $this->hasUsersProgramColumnCache = Schema::hasTable('users') && Schema::hasColumn('users', 'program');

        return $this->hasUsersProgramColumnCache;
    }

    /**
     * @return array<int, string>
     */
    private function existingEmails(): array
    {
        return User::query()
            ->whereNotNull('email')
            ->pluck('email')
            ->filter(fn (mixed $email): bool => is_string($email) && trim($email) !== '')
            ->map(fn (string $email): string => strtolower(trim($email)))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function studentListingColumns(): array
    {
        $columns = ['id', 'name', 'first_name', 'last_name', 'email', 'status', 'created_at'];

        if ($this->hasUsersProgramColumn()) {
            $columns[] = 'program';
        }

        return $columns;
    }

    private function redirectToListing(Request $request, string $message, bool $isError = false): RedirectResponse
    {
        $from = $request->string('from')->toString();
        $routeName = 'admin.users.index';

        if ($from === 'student') {
            $routeName = 'admin.users.students';
        }

        if ($from === 'faculty') {
            $routeName = 'admin.users.faculty';
        }

        $redirect = redirect()->route($routeName);

        return $isError ? $redirect->with('error', $message) : $redirect->with('success', $message);
    }

    private function buildDisplayName(string $firstName, string $lastName): string
    {
        return trim($firstName.' '.$lastName);
    }

    private function buildFullName(string $firstName, string $lastName, ?string $fallbackName): string
    {
        if ($firstName !== '' || $lastName !== '') {
            return trim($lastName.', '.$firstName, ', ');
        }

        return is_string($fallbackName) ? $fallbackName : '';
    }

    private function extendExecutionTimeForBulkImport(): void
    {
        if (function_exists('set_time_limit')) {
            set_time_limit(0);
        }
    }

    /**
     * @return array<string, int>
     */
    private function roleIdsBySlug(): array
    {
        return Role::query()
            ->pluck('id', 'slug')
            ->mapWithKeys(fn (mixed $id, mixed $slug): array => [(string) $slug => (int) $id])
            ->all();
    }

    private function bulkImportCacheKey(string $importId): string
    {
        return 'bulk_user_import:'.$importId;
    }

    private function resolveEntityType(Request $request): string
    {
        $queryEntityType = $request->query('type');
        if (is_string($queryEntityType) && in_array($queryEntityType, self::ENTITY_TYPES, true)) {
            return $queryEntityType;
        }

        $entityType = $request->input('type', 'user');

        if (! is_string($entityType)) {
            return 'user';
        }

        return in_array($entityType, self::ENTITY_TYPES, true) ? $entityType : 'user';
    }

    private function resolveBulkImportQueueConnection(): string
    {
        $defaultQueueConnection = config('queue.default', 'database');

        if (! is_string($defaultQueueConnection) || $defaultQueueConnection === '') {
            return 'background';
        }

        if (in_array($defaultQueueConnection, ['sync', 'database'], true)) {
            return 'background';
        }

        return $defaultQueueConnection;
    }
}
