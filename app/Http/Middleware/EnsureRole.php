<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

class EnsureRole
{
    /**
     * Handle an incoming request.
     * Accepts one or more roles as parameters.
     */
    public function handle(Request $request, Closure $next, ?string $role = null): mixed
    {
        if (! Auth::guard('web')->check()) {
            return redirect()->route('login');
        }

        $user = Auth::guard('web')->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        if ($role !== null) {
            $allowedRoles = array_map('trim', explode('|', $role));
            $hasAllowedRole = collect($allowedRoles)->contains(fn (string $allowedRole): bool => $user->hasRole($allowedRole));

            if (! $hasAllowedRole) {
                return $this->redirectToActiveDashboard((string) $user->role);
            }

            $normalizedActiveRole = Role::normalizeRole((string) $user->role);

            if ($normalizedActiveRole === null || ! in_array($normalizedActiveRole, $allowedRoles, true)) {
                $fallbackRole = collect($allowedRoles)
                    ->first(fn (string $allowedRole): bool => $user->hasRole($allowedRole));

                if (is_string($fallbackRole) && $fallbackRole !== '') {
                    $user->forceFill(['role' => $fallbackRole])->save();
                }
            }
        }

        return $next($request);
    }

    private function redirectToActiveDashboard(string $activeRole): RedirectResponse
    {
        $routeName = $activeRole.'.dashboard';

        if (Route::has($routeName)) {
            return redirect()->route($routeName);
        }

        return redirect()->route('login');
    }
}
