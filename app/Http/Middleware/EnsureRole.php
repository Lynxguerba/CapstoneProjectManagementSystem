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
    public function handle(Request $request, Closure $next, string $role = null)
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        if ($role !== null) {
            // Allow pipe-separated roles as fallback
            $allowed = array_map('trim', explode('|', $role));

            if (!in_array($user->role, $allowed, true)) {
                // Redirect the user to their own dashboard if they try to access another role's pages
                return redirect()->route($user->role . '.dashboard');
            }
        }

        return $next($request);
    }
}
