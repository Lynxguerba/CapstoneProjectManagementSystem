<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SwitchRoleController extends Controller
{
    protected array $roleDashboards = [
        'admin' => 'admin.dashboard',
        'instructor' => 'instructor.dashboard',
        'adviser' => 'adviser.dashboard',
        'panelist' => 'panelist.dashboard',
        'program_chairperson' => 'program_chairperson.dashboard',
        'dean' => 'dean.dashboard',
        'student' => 'student.dashboard',
    ];

    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();
        $requestedRole = $request->input('role');

        if (! $requestedRole) {
            return back()->withErrors(['role' => 'No role specified.']);
        }

        $userRoles = $user?->roles->pluck('slug')->toArray() ?? [];

        if (! in_array($requestedRole, $userRoles, true)) {
            abort(403, 'You are not assigned to this role.');
        }

        if (session('active_role') === $requestedRole) {
            $dashboard = $this->roleDashboards[$requestedRole] ?? 'login';

            return redirect()->route($dashboard);
        }

        if ($user !== null && $user->role !== $requestedRole) {
            $user->forceFill([
                'role' => $requestedRole,
            ])->save();
        }

        $request->session()->put('active_role', $requestedRole);

        $request->session()->regenerate();

        $dashboard = $this->roleDashboards[$requestedRole] ?? 'login';

        return redirect()->route($dashboard);
    }
}
