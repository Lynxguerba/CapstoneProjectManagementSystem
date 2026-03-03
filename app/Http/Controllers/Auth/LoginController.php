<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

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

        if (! $user || ! Hash::check($request->password, $user->password) || ! $user->hasRole($requestedRole)) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
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
}
