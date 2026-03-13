<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SwitchRoleController extends Controller
{
    /**
     * Role-to-redirect mapping. Must match the named routes in web.php.
     */
    protected array $roleDashboards = [
        'admin' => 'admin.dashboard',
        'instructor' => 'instructor.dashboard',
        'adviser' => 'adviser.dashboard',
        'panelist' => 'panelist.dashboard',
        'program_chairperson' => 'program_chairperson.dashboard',
        'dean' => 'dean.dashboard',
        'student' => 'student.dashboard',
    ];

    public function __invoke(Request $request)
    {
        $user = $request->user();
        $requestedRole = $request->input('role');

        if (! $requestedRole) {
            return back()->withErrors(['role' => 'No role specified.']);
        }

        // Get all roles assigned to this user from the roles relationship
        $userRoles = $user->roles->pluck('slug')->toArray();

        // Reject if user does not actually own this role
        if (! in_array($requestedRole, $userRoles)) {
            abort(403, 'You are not assigned to this role.');
        }

        if ($user->role !== $requestedRole) {
            $user->forceFill([
                'role' => $requestedRole,
            ])->save();
        }

        // Do not switch if already on this role
        if (session('active_role') === $requestedRole) {
            $dashboard = $this->roleDashboards[$requestedRole] ?? 'login';

            return redirect()->route($dashboard);
        }

        // Update active role in session
        $request->session()->put('active_role', $requestedRole);

        // Regenerate session ID to prevent session fixation attacks
        $request->session()->regenerate();

        // Redirect to the new role's dashboard
        $dashboard = $this->roleDashboards[$requestedRole] ?? 'login';

        return redirect()->route($dashboard);
    }
}
