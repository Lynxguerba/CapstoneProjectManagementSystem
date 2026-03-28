<?php

namespace App\Http\Middleware;

use App\Models\User;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class EnforceSingleBrowserSession
{
    private const SESSION_CONFLICT_MESSAGE = 'The user you entered is already logged in on another browser.';

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || ! $this->supportsActiveSessionTracking()) {
            return $next($request);
        }

        $currentSessionId = (string) $request->session()->getId();

        if ($currentSessionId === '') {
            return $next($request);
        }

        $storedSessionId = is_string($user->active_session_id ?? null)
            ? trim((string) $user->active_session_id)
            : '';

        if ($storedSessionId !== '' && $storedSessionId !== $currentSessionId && ! $this->sessionLockExpired($user)) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => self::SESSION_CONFLICT_MESSAGE,
            ]);
        }

        $this->touchActiveSessionLock($user, $currentSessionId, $storedSessionId);

        return $next($request);
    }

    private function touchActiveSessionLock(User $user, string $currentSessionId, string $storedSessionId): void
    {
        $lastActivity = $this->resolveLastActivityTimestamp($user);
        $needsRefresh = $storedSessionId !== $currentSessionId
            || ! $lastActivity instanceof CarbonInterface
            || $lastActivity->lt(now()->subMinute());

        if (! $needsRefresh) {
            return;
        }

        User::withoutTimestamps(function () use ($user, $currentSessionId): void {
            $user->forceFill([
                'active_session_id' => $currentSessionId,
                'active_session_last_activity_at' => now(),
            ])->saveQuietly();
        });
    }

    private function sessionLockExpired(User $user): bool
    {
        $lastActivity = $this->resolveLastActivityTimestamp($user);

        if (! $lastActivity instanceof CarbonInterface) {
            return false;
        }

        return $lastActivity->lt(now()->subMinutes($this->sessionLifetimeInMinutes()));
    }

    private function resolveLastActivityTimestamp(User $user): ?CarbonInterface
    {
        $lastActivity = $user->active_session_last_activity_at ?? null;

        if ($lastActivity instanceof CarbonInterface) {
            return $lastActivity;
        }

        if (! is_string($lastActivity) || trim($lastActivity) === '') {
            return null;
        }

        try {
            return Carbon::parse($lastActivity);
        } catch (\Throwable) {
            return null;
        }
    }

    private function sessionLifetimeInMinutes(): int
    {
        return max(1, (int) config('session.lifetime', 120));
    }

    private function supportsActiveSessionTracking(): bool
    {
        if (! Schema::hasTable('users')) {
            return false;
        }

        return Schema::hasColumn('users', 'active_session_id')
            && Schema::hasColumn('users', 'active_session_last_activity_at');
    }
}
