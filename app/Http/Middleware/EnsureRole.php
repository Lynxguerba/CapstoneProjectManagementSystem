<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
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

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        $activeRole = session('active_role');

        if (! $activeRole) {
            return redirect()->route('login');
        }

        if (! in_array($activeRole, $roles)) {
            $fallbackRoute = $this->roleDashboards[$activeRole] ?? 'login';

            return redirect()->route($fallbackRoute);
        }

        return $next($request);
    }
}
