<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\StoreBulkAdminUsersRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Http\Requests\Admin\UpdateFacultyRequest;
use App\Http\Requests\Admin\UpdateStudentRequest;
use App\Models\Faculty;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

            Faculty::query()->create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'roles' => $roles->first() ?? 'adviser',
                'status' => $validated['status'] ?? 'active',
            ]);

            return redirect()->route('admin.users.faculty')->with('success', 'Faculty account created successfully.');
        }

        if ($entityType === 'student') {
            Student::query()->create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'program' => $validated['program'],
                'password' => $validated['password'],
                'status' => $validated['status'] ?? 'active',
            ]);

            return redirect()->route('admin.users.students')->with('success', 'Student created successfully.');
        }

        $roles = collect($validated['roles'])
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter()
            ->values();

        $activeRole = $roles->first() ?? 'student';
        $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);

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

        return redirect()->route('admin.users.index')->with('success', 'User account created successfully.');
    }

    public function update(UpdateAdminUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $roles = collect($validated['roles'])
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter()
            ->values();
        $activeRole = $roles->first() ?? 'student';
        $name = $this->buildDisplayName($validated['first_name'], $validated['last_name']);

        $user->update([
            'name' => $name,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'role' => $activeRole,
            'status' => $validated['status'],
        ]);

        $user->syncRoles($roles->all());

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

                Faculty::query()->create([
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'roles' => $roles->first() ?? 'adviser',
                    'status' => $row['status'] ?? 'active',
                ]);
            });

            return redirect()->route('admin.users.faculty')->with('success', 'Faculty users uploaded successfully.');
        }

        if ($entityType === 'student') {
            collect($validated['rows'])->each(function (array $row): void {
                Student::query()->create([
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'program' => $row['program'],
                    'password' => $row['password'],
                    'status' => $row['status'] ?? 'active',
                ]);
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
        });

        return redirect()->route('admin.users.index')->with('success', 'Users uploaded successfully.');
    }

    public function updateStudent(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        $validated = $request->validated();

        $student->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'program' => $validated['program'],
            'status' => $validated['status'],
        ]);

        return redirect()->route('admin.users.students')->with('success', 'Student account updated successfully.');
    }

    public function updateFaculty(UpdateFacultyRequest $request, Faculty $faculty): RedirectResponse
    {
        $validated = $request->validated();
        $normalizedRole = Role::normalizeRole($validated['roles'][0] ?? '') ?? 'adviser';

        $faculty->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'roles' => in_array($normalizedRole, self::FACULTY_ASSIGNABLE_ROLES, true) ? $normalizedRole : 'adviser',
            'status' => $validated['status'],
        ]);

        return redirect()->route('admin.users.faculty')->with('success', 'Faculty account updated successfully.');
    }

    public function students(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
        ];

        $students = Student::query()
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $query->where(function (Builder $innerQuery) use ($filters) {
                    $innerQuery
                        ->where('first_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%')
                        ->orWhere('program', 'like', '%'.$filters['search'].'%');
                });
            })
            ->orderByDesc('created_at')
            ->get(['id', 'first_name', 'last_name', 'email', 'program', 'status', 'created_at'])
            ->map(function (Student $student): array {
                $firstName = trim($student->first_name);
                $lastName = trim($student->last_name);
                $fullName = trim($lastName.', '.$firstName, ', ');
                $status = is_string($student->status) && $student->status !== '' ? $student->status : 'active';

                return [
                    'id' => $student->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $student->email,
                    'program' => $student->program,
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

        $faculties = Faculty::query()
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $query->where(function (Builder $innerQuery) use ($filters) {
                    $innerQuery
                        ->where('first_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['role'] !== '' && $filters['role'] !== 'all' && in_array($filters['role'], $facultyRoles), function (Builder $query) use ($filters) {
                $query->where('roles', $filters['role']);
            })
            ->orderByDesc('created_at')
            ->get(['id', 'first_name', 'last_name', 'email', 'roles', 'status', 'created_at'])
            ->map(function (Faculty $faculty): array {
                $firstName = trim($faculty->first_name);
                $lastName = trim($faculty->last_name);
                $fullName = trim($lastName.', '.$firstName, ', ');

                return [
                    'id' => $faculty->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $faculty->email,
                    'role' => $faculty->roles,
                    'roles' => [$faculty->roles],
                    'status' => $faculty->status,
                    'createdAt' => $faculty->created_at?->format('Y-m-d') ?? '',
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
