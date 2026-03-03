<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            'email' => 'required|email',
            'password' => 'required',
            'role' => ['required', 'string', Rule::in(array_keys(self::ROLE_DASHBOARD_ROUTES))],
        ]);

        $requestedRole = $this->normalizeRole((string) $request->input('role'));

        $user = User::query()->where('email', $request->email)->first();
        $storedRole = $user !== null ? $this->normalizeRole((string) $user->role) : null;

        if (! $user || ! Hash::check($request->password, $user->password) || $storedRole !== $requestedRole) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        $dashboardRoute = self::ROLE_DASHBOARD_ROUTES[$storedRole] ?? null;

        if ($dashboardRoute === null) {
            return back()->withErrors([
                'role' => 'The selected role is not configured for dashboard access.',
            ]);
        }

        if ($user->role !== $storedRole) {
            $user->forceFill([
                'role' => $storedRole,
            ])->save();
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return redirect()->route($dashboardRoute);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    private function normalizeRole(string $role): string
    {
        return Str::of($role)
            ->trim()
            ->lower()
            ->replace('-', '_')
            ->replace(' ', '_')
            ->value();
    }
}
