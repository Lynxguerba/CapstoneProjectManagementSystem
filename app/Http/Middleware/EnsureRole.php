<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
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
        $user = $request->user();

        if (! $user instanceof User) {
            return redirect()->route('login');
        }

        if ($this->isInactiveAccount($user)) {
            $this->recordInactiveAutoLogoutAudit($user, $request);

            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account is inactive.',
            ]);
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

    private function isInactiveAccount(User $user): bool
    {
        $status = is_string($user->status ?? null) ? trim(strtolower((string) $user->status)) : '';

        return $status === 'inactive';
    }

    private function recordInactiveAutoLogoutAudit(User $user, Request $request): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $actorName = $firstName !== '' || $lastName !== ''
            ? trim($firstName.' '.$lastName)
            : (is_string($user->name) ? trim($user->name) : 'User');

        try {
            AuditLog::query()->create([
                'user_id' => $user->id,
                'actor_name' => $actorName !== '' ? $actorName : 'User',
                'action' => 'Automatic Sign Out (Inactive Account)',
                'entity' => 'Authentication',
                'severity' => 'warning',
                'route_name' => $request->route()?->getName(),
                'http_method' => $request->method(),
                'status_code' => 302,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => 'User was automatically signed out because the account is inactive.',
                'metadata' => [
                    'active_role' => $request->session()->get('active_role'),
                    'assigned_roles' => $user->roleSlugs(),
                    'logout_reason' => 'inactive_account',
                ],
            ]);
        } catch (\Throwable $e) {
            return;
        }
    }
}
