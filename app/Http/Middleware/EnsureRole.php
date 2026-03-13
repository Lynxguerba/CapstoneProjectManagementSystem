<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Role-to-route mapping. Add all roles here.
     * Key = session active_role value, Value = named route for that role's dashboard.
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

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Not authenticated at all
        if (! $request->user()) {
            return redirect()->route('login');
        }

        $activeRole = session('active_role');

        // No active role in session means logged out or invalid session
        if (! $activeRole) {
            return redirect()->route('login');
        }

        // Active role does not match any of the allowed roles for this route group
        if (! in_array($activeRole, $roles)) {
            // Redirect to the correct dashboard for their actual active role
            $fallbackRoute = $this->roleDashboards[$activeRole] ?? 'login';

            return redirect()->route($fallbackRoute);
        }

        return $next($request);
    }
}
