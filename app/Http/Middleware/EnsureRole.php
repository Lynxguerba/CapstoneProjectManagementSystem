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

        $blockedAccountMessage = $this->resolveBlockedAccountMessage($user);

        if ($blockedAccountMessage !== null) {
            $this->recordBlockedAutoLogoutAudit($user, $request, $blockedAccountMessage);
            $this->clearStoredActiveSessionIfOwnedBySession($user, (string) $request->session()->getId());

            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => $blockedAccountMessage,
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

    private function resolveBlockedAccountMessage(User $user): ?string
    {
        $status = is_string($user->status ?? null) ? trim(strtolower((string) $user->status)) : '';

        if ($status === 'pending') {
            return 'Your registration is pending admin approval.';
        }

        if ($status === 'inactive') {
            return 'Your account is inactive.';
        }

        return null;
    }

    private function clearStoredActiveSessionIfOwnedBySession(User $user, string $sessionId): void
    {
        if (! $this->supportsActiveSessionTracking()) {
            return;
        }

        $storedSessionId = is_string($user->active_session_id ?? null)
            ? trim((string) $user->active_session_id)
            : '';

        if ($storedSessionId !== '' && $storedSessionId !== $sessionId) {
            return;
        }

        User::withoutTimestamps(function () use ($user): void {
            $user->forceFill([
                'active_session_id' => null,
                'active_session_last_activity_at' => null,
            ])->saveQuietly();
        });
    }

    private function supportsActiveSessionTracking(): bool
    {
        if (! Schema::hasTable('users')) {
            return false;
        }

        return Schema::hasColumn('users', 'active_session_id')
            && Schema::hasColumn('users', 'active_session_last_activity_at');
    }

    private function recordBlockedAutoLogoutAudit(User $user, Request $request, string $message): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $actorName = $firstName !== '' || $lastName !== ''
            ? trim($firstName.' '.$lastName)
            : (is_string($user->name) ? trim($user->name) : 'User');
        $logoutReason = str_contains(strtolower($message), 'pending') ? 'pending_approval' : 'inactive_account';

        try {
            AuditLog::query()->create([
                'user_id' => $user->id,
                'actor_name' => $actorName !== '' ? $actorName : 'User',
                'action' => 'Automatic Sign Out (Blocked Account)',
                'entity' => 'Authentication',
                'severity' => 'warning',
                'route_name' => $request->route()?->getName(),
                'http_method' => $request->method(),
                'status_code' => 302,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => $message,
                'metadata' => [
                    'active_role' => $request->session()->get('active_role'),
                    'assigned_roles' => $user->roleSlugs(),
                    'logout_reason' => $logoutReason,
                ],
            ]);
        } catch (\Throwable $e) {
            return;
        }
    }
}
