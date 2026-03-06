<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    /**
     * @var array<string, string>
     */
    private const ROLE_DASHBOARD_ROUTES = [
        'admin' => 'admin.dashboard',
        'student' => 'student.dashboard',
        'adviser' => 'adviser.dashboard',
        'panelist' => 'panelist.dashboard',
        'instructor' => 'instructor.dashboard',
        'dean' => 'dean.dashboard',
        'program_chairperson' => 'program_chairperson.dashboard',
    ];

    /**
     * @var array<int, string>
     */
    private const FACULTY_ROLES = [
        'admin',
        'adviser',
        'panelist',
        'instructor',
        'dean',
        'program_chairperson',
    ];

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
            'role' => ['required', 'string'],
        ]);

        $requestedRole = Role::normalizeRole((string) $request->input('role'));

        if ($requestedRole === null || ! array_key_exists($requestedRole, self::ROLE_DASHBOARD_ROUTES)) {
            return back()->withErrors([
                'role' => 'The selected role is not configured for dashboard access.',
            ]);
        }

        $user = User::query()->with('roles:id,slug')->where('email', $request->email)->first();

        if (! $user || ! $this->passwordMatches($user, (string) $request->input('password'))) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        if (! $this->canAccessRequestedRole($user, $requestedRole)) {
            return back()->withErrors([
                'role' => 'You are not assigned to the selected role.',
            ]);
        }

        if ($user->role !== $requestedRole) {
            $user->forceFill([
                'role' => $requestedRole,
            ])->save();
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return redirect()->route(self::ROLE_DASHBOARD_ROUTES[$requestedRole]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function switchRole(Request $request): RedirectResponse
    {
        $request->validate([
            'role' => ['required', 'string'],
        ]);

        $requestedRole = Role::normalizeRole((string) $request->input('role'));

        if ($requestedRole === null || ! array_key_exists($requestedRole, self::ROLE_DASHBOARD_ROUTES)) {
            return back()->withErrors([
                'role' => 'The selected role is not configured for dashboard access.',
            ]);
        }

        $user = Auth::guard('web')->user();

        if (! $user instanceof User || ! $user->hasRole($requestedRole)) {
            return back()->withErrors([
                'role' => 'You are not assigned to the selected role.',
            ]);
        }

        if ($user->role !== $requestedRole) {
            $user->forceFill([
                'role' => $requestedRole,
            ])->save();
        }

        return redirect()->route(self::ROLE_DASHBOARD_ROUTES[$requestedRole]);
    }

    private function canAccessRequestedRole(User $user, string $requestedRole): bool
    {
        if ($user->hasRole($requestedRole)) {
            return true;
        }

        if (! in_array($requestedRole, self::FACULTY_ROLES, true)) {
            return false;
        }

        $normalizedActiveRole = Str::of((string) $user->role)
            ->trim()
            ->lower()
            ->replace('-', '_')
            ->replace(' ', '_')
            ->value();

        if ($normalizedActiveRole === 'faculty') {
            return true;
        }

        return collect(self::FACULTY_ROLES)->contains(
            fn (string $role): bool => $role !== 'student' && $user->hasRole($role)
        );
    }

    private function passwordMatches(User $user, string $plainPassword): bool
    {
        if (Hash::check($plainPassword, (string) $user->password)) {
            return true;
        }

        if ((string) $user->password !== $plainPassword) {
            return false;
        }

        $user->forceFill([
            'password' => $plainPassword,
        ])->save();

        return true;
    }
}
