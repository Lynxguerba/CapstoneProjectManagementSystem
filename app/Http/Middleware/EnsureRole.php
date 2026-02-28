<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureRole
{
    /**
     * Handle an incoming request.
     * Accepts one or more roles as parameters.
     */
    public function handle(Request $request, Closure $next, ?string $role = null)
    {
        if (! Auth::guard('web')->check()) {
            return redirect()->route('login');
        }

        $user = Auth::guard('web')->user();

        if ($role !== null) {
            $allowed = array_map('trim', explode('|', $role));

            if (! in_array($user->role, $allowed, true)) {
                return redirect()->route($user->role.'.dashboard');
            }
        }

        return $next($request);
    }
}
