<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\StoreBulkAdminUsersRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
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
        $validated = $request->validated();
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
        $validated = $request->validated();

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

    public function students(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
        ];

        $users = User::query()
            ->with('roles:id,slug')
            ->whereHas('roles', function (Builder $roleQuery) {
                $roleQuery->where('slug', 'student');
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

        return Inertia::render('Admin/students', [
            'users' => $users,
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

        $facultyRoles = ['adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];

        $users = User::query()
            ->with('roles:id,slug')
            ->whereHas('roles', function (Builder $roleQuery) use ($facultyRoles) {
                $roleQuery->whereIn('slug', $facultyRoles);
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
            ->when($filters['role'] !== '' && $filters['role'] !== 'all' && in_array($filters['role'], $facultyRoles), function (Builder $query) use ($filters) {
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
                    : ($roleSlugs[0] ?? 'adviser');
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

        return Inertia::render('Admin/faculty', [
            'users' => $users,
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
