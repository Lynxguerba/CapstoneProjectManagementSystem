<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const AVAILABLE_ROLES = [
        'admin',
        'student',
        'adviser',
        'instructor',
        'panelist',
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
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $query->where(function ($innerQuery) use ($filters) {
                    $innerQuery
                        ->where('name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['role'] !== '' && $filters['role'] !== 'all', function ($query) use ($filters) {
                $query->where('role', $filters['role']);
            })
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'email', 'role', 'created_at'])
            ->map(function (User $user): array {
                $role = is_string($user->role) && $user->role !== '' ? $user->role : 'student';

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role,
                    'status' => 'active',
                    'createdAt' => $user->created_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values();

        return Inertia::render('Admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $filters['search'],
                'role' => $filters['role'] !== '' ? $filters['role'] : 'all',
                'status' => 'all',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/users/create', [
            'availableRoles' => self::AVAILABLE_ROLES,
        ]);
    }

    public function store(StoreAdminUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $validated['password'],
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User account created successfully.');
    }

    public function update(UpdateAdminUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User account updated successfully.');
    }
}
