<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

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
        $this->storeActiveSessionFingerprint($user, (string) $request->session()->getId());

        Inertia::clearHistory();

        $dashboard = $this->roleDashboards[$requestedRole] ?? 'login';

        return redirect()->route($dashboard);
    }

    private function storeActiveSessionFingerprint(?User $user, string $sessionId): void
    {
        if (! $user instanceof User || $sessionId === '' || ! $this->supportsActiveSessionTracking()) {
            return;
        }

        User::withoutTimestamps(function () use ($user, $sessionId): void {
            $user->forceFill([
                'active_session_id' => $sessionId,
                'active_session_last_activity_at' => now(),
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
}
