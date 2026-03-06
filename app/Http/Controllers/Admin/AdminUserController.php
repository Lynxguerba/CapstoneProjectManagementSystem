<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\StoreBulkAdminUsersRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\Role;
use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
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
            'filters' => [
                'search' => $filters['search'],
                'role' => $filters['role'] !== '' ? $filters['role'] : 'all',
                'status' => 'all',
            ],
        ]);
    }

    public function store(StoreAdminUserRequest $request): RedirectResponse
    {
        $entityType = $request->query('type', 'user');
        $validated = $request->validated();

        if ($entityType === 'faculty') {
            $roles = collect($validated['roles'] ?? [])
                ->map(fn (string $role): ?string => Role::normalizeRole($role))
                ->filter(fn (?string $role): bool => is_string($role) && in_array($role, self::FACULTY_ASSIGNABLE_ROLES, true))
                ->filter()
                ->values();

            $activeRole = $roles->first() ?? 'adviser';
            $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);

            $user = User::query()->create([
                'name' => $name,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'role' => $activeRole,
                'status' => $validated['status'] ?? 'active',
                'password' => Hash::make(Str::password(24)),
            ]);

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

        $user->update([
            'name' => $name,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'role' => $activeRole,
            'status' => $validated['status'],
        ]);

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

    public function bulkStore(StoreBulkAdminUsersRequest $request): RedirectResponse
    {
        $entityType = $request->query('type', 'user');
        $validated = $request->validated();

        if ($entityType === 'faculty') {
            collect($validated['rows'])->each(function (array $row): void {
                $roles = collect($row['roles'] ?? [])
                    ->map(fn (string $role): ?string => Role::normalizeRole($role))
                    ->filter(fn (?string $role): bool => is_string($role) && in_array($role, self::FACULTY_ASSIGNABLE_ROLES, true))
                    ->filter()
                    ->values();

                $activeRole = $roles->first() ?? 'adviser';
                $name = $this->buildDisplayName($row['first_name'], $row['last_name']);

                $user = User::query()->create([
                    'name' => $name,
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'role' => $activeRole,
                    'status' => $row['status'] ?? 'active',
                    'password' => Hash::make(Str::password(24)),
                ]);

                $user->syncRoles($roles->all());
            });

            return redirect()->route('admin.users.faculty')->with('success', 'Faculty users uploaded successfully.');
        }

        if ($entityType === 'student') {
            collect($validated['rows'])->each(function (array $row): void {
                $name = $this->buildDisplayName($row['first_name'], $row['last_name']);

                $user = User::query()->create([
                    'name' => $name,
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'role' => 'student',
                    'status' => $row['status'] ?? 'active',
                    'password' => $row['password'],
                ]);

                $user->syncRoles(['student']);
                $this->syncStudentProfile($user, $row['program'], true);
            });

            return redirect()->route('admin.users.students')->with('success', 'Students uploaded successfully.');
        }

        collect($validated['rows'])->each(function (array $row): void {
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
                'status' => $row['status'] ?? 'active',
                'password' => $row['password'],
            ]);

            $user->syncRoles($roles->all());
            $this->syncStudentProfile($user, $row['program'] ?? null, in_array('student', $roles->all(), true));
        });

        return redirect()->route('admin.users.index')->with('success', 'Users uploaded successfully.');
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
            ->orderByDesc('users.created_at')
            ->get(['id', 'name', 'first_name', 'last_name', 'email', 'status', 'created_at'])
            ->map(function (User $student) use ($hasStudentProgramTable): array {
                $firstName = is_string($student->first_name) ? trim($student->first_name) : '';
                $lastName = is_string($student->last_name) ? trim($student->last_name) : '';
                $fullName = $this->buildFullName($firstName, $lastName, $student->name);
                $status = is_string($student->status) && $student->status !== '' ? $student->status : 'active';
                $program = $hasStudentProgramTable
                    ? $student->studentProgram?->program
                    : null;

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
            ->orderByDesc('users.created_at')
            ->get(['id', 'name', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at'])
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

                return [
                    'id' => $user->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $user->email,
                    'role' => $resolvedRoles[0],
                    'roles' => $resolvedRoles,
                    'status' => $status,
                    'createdAt' => $user->created_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values();

        return Inertia::render('Admin/faculty', [
            'faculties' => $faculties,
            'filters' => [
                'search' => $filters['search'],
                'role' => $filters['role'] !== '' ? $filters['role'] : 'all',
            ],
        ]);
    }

    private function normalizeStudentProgram(?string $programCode): ?string
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

    private function syncStudentProfile(User $user, ?string $programCode, bool $isStudent): void
    {
        if (! $this->hasStudentProgramTable()) {
            return;
        }

        if (! $isStudent) {
            $user->studentProgram()->delete();

            return;
        }

        $resolvedProgram = $this->normalizeStudentProgram($programCode) ?? 'BSIT';

        StudentProgram::query()->updateOrCreate(
            ['student_id' => $user->id],
            ['program' => $resolvedProgram]
        );
    }

    private function hasStudentProgramTable(): bool
    {
        return Schema::hasTable('student_program');
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
}
