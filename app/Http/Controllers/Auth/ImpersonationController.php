<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StoreImpersonationRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ImpersonationController extends Controller
{
    /**
     * @var array<string, string>
     */
    private const ROLE_DASHBOARD_ROUTES = [
        'admin' => 'admin.dashboard',
        'student' => 'student.dashboard',
        'adviser' => 'adviser.dashboard',
        'panelist' => 'panelist.dashboard',
        'instructor' => 'instructor.dashboard',
        'dean' => 'dean.dashboard',
        'program_chairperson' => 'program_chairperson.dashboard',
    ];

    public function search(Request $request): JsonResponse
    {
        $actingDean = $this->resolveActingDean($request);

        if (! $actingDean instanceof User) {
            abort(403, 'Only dean-origin sessions can search users for impersonation.');
        }

        $search = trim((string) $request->input('q', ''));

        if ($search === '') {
            return response()->json([
                'users' => [],
            ]);
        }

        $searchTerms = collect(preg_split('/\s+/', $search) ?: [])
            ->map(fn (mixed $term): string => trim((string) $term))
            ->filter(fn (string $term): bool => $term !== '')
            ->values();

        $excludedUserIds = collect([
            $request->user()?->id,
            $actingDean->id,
        ])
            ->filter(fn (mixed $id): bool => is_int($id) || ctype_digit((string) $id))
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        $users = User::query()
            ->with('roles:id,slug')
            ->whereNotNull('email')
            ->when($excludedUserIds !== [], fn (Builder $query) => $query->whereNotIn('id', $excludedUserIds))
            ->where(function (Builder $query) use ($search, $searchTerms): void {
                $likeQuery = '%'.$search.'%';

                $query
                    ->where('first_name', 'like', $likeQuery)
                    ->orWhere('last_name', 'like', $likeQuery)
                    ->orWhere('name', 'like', $likeQuery)
                    ->orWhere('email', 'like', $likeQuery);

                if ($searchTerms->count() > 1) {
                    $query->orWhere(function (Builder $nameQuery) use ($searchTerms): void {
                        foreach ($searchTerms as $term) {
                            $termLike = '%'.$term.'%';

                            $nameQuery->where(function (Builder $segmentQuery) use ($termLike): void {
                                $segmentQuery
                                    ->where('first_name', 'like', $termLike)
                                    ->orWhere('last_name', 'like', $termLike)
                                    ->orWhere('name', 'like', $termLike)
                                    ->orWhere('email', 'like', $termLike);
                            });
                        }
                    });
                }
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(10)
            ->get(['id', 'name', 'first_name', 'last_name', 'email', 'role', 'status'])
            ->filter(function (User $user): bool {
                return $this->resolveDashboardRole($user) !== null
                    && $this->resolveBlockedAccountMessage($user) === null;
            })
            ->map(function (User $user): array {
                $fullName = $this->buildDisplayName($user);

                return [
                    'full_name' => $fullName,
                    'first_name' => is_string($user->first_name) ? trim($user->first_name) : '',
                    'last_name' => is_string($user->last_name) ? trim($user->last_name) : '',
                    'email' => is_string($user->email) ? trim($user->email) : '',
                    'roles' => $user->roleSlugs(),
                    'active_role' => $this->resolveDashboardRole($user),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'users' => $users,
        ]);
    }

    public function store(StoreImpersonationRequest $request): RedirectResponse
    {
        $impersonator = $this->resolveActingDean($request);
        $sessionUser = $request->user();

        if (! $impersonator instanceof User || ! $impersonator->hasRole('dean')) {
            abort(403, 'Only dean accounts can impersonate users.');
        }

        $targetUser = User::query()
            ->with('roles:id,slug')
            ->where('email', $request->string('email')->toString())
            ->firstOrFail();

        $excludedTargetIds = collect([
            $sessionUser?->id,
            $impersonator->id,
        ])
            ->filter(fn (mixed $id): bool => is_int($id) || ctype_digit((string) $id))
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        if (in_array($targetUser->id, $excludedTargetIds, true)) {
            return back()->withErrors([
                'email' => 'Choose a different user account.',
            ]);
        }

        $targetRole = $this->resolveDashboardRole($targetUser);

        if ($targetRole === null) {
            return back()->withErrors([
                'email' => 'The selected user does not have a dashboard-enabled role.',
            ]);
        }

        if ($this->resolveBlockedAccountMessage($targetUser) !== null) {
            return back()->withErrors([
                'email' => 'The selected user account is not available for impersonation.',
            ]);
        }

        $currentSessionId = (string) $request->session()->getId();

        Auth::guard('web')->login($targetUser);
        $request->session()->regenerate();
        $request->session()->put('impersonator_id', $impersonator->id);
        $request->session()->put('active_role', $targetRole);

        $this->syncDisplayedRole($targetUser, $targetRole);

        if ($sessionUser instanceof User) {
            $this->clearStoredActiveSessionIfOwnedBySession($sessionUser, $currentSessionId);
        }

        $this->storeActiveSessionFingerprint($targetUser, (string) $request->session()->getId());

        Inertia::clearHistory();

        return redirect()->route(self::ROLE_DASHBOARD_ROUTES[$targetRole]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $impersonatorId = (int) $request->session()->get('impersonator_id');

        if ($impersonatorId <= 0) {
            return back()->withErrors([
                'impersonation' => 'No active impersonation session was found.',
            ]);
        }

        $currentUser = $request->user();
        $impersonator = User::query()
            ->with('roles:id,slug')
            ->find($impersonatorId);

        if (! $impersonator instanceof User || ! $impersonator->hasRole('dean')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Unable to restore the dean session.',
            ]);
        }

        $currentSessionId = (string) $request->session()->getId();

        Auth::guard('web')->login($impersonator);
        $request->session()->regenerate();
        $request->session()->forget('impersonator_id');
        $request->session()->put('active_role', 'dean');

        $this->syncDisplayedRole($impersonator, 'dean');

        if ($currentUser instanceof User) {
            $this->clearStoredActiveSessionIfOwnedBySession($currentUser, $currentSessionId);
        }

        $this->storeActiveSessionFingerprint($impersonator, (string) $request->session()->getId());

        Inertia::clearHistory();

        return redirect()->route(self::ROLE_DASHBOARD_ROUTES['dean']);
    }

    private function resolveActingDean(Request $request): ?User
    {
        $user = $request->user();

        if ($user instanceof User && $user->hasRole('dean')) {
            return $user;
        }

        $impersonatorId = (int) $request->session()->get('impersonator_id');

        if ($impersonatorId <= 0) {
            return null;
        }

        $impersonator = User::query()
            ->with('roles:id,slug')
            ->find($impersonatorId);

        return $impersonator instanceof User && $impersonator->hasRole('dean')
            ? $impersonator
            : null;
    }

    private function resolveDashboardRole(User $user): ?string
    {
        $storedRole = Role::normalizeRole((string) $user->role);

        if ($storedRole !== null && array_key_exists($storedRole, self::ROLE_DASHBOARD_ROUTES) && $user->hasRole($storedRole)) {
            return $storedRole;
        }

        $assignedRole = collect($user->roleSlugs())
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter(fn (?string $role): bool => $role !== null && array_key_exists($role, self::ROLE_DASHBOARD_ROUTES))
            ->first();

        return is_string($assignedRole) ? $assignedRole : null;
    }

    private function syncDisplayedRole(User $user, string $role): void
    {
        if ($user->role === $role) {
            return;
        }

        $user->forceFill([
            'role' => $role,
        ])->save();
    }

    private function resolveBlockedAccountMessage(User $user): ?string
    {
        $status = is_string($user->status) ? trim(strtolower($user->status)) : '';

        if ($status === 'pending') {
            return 'Your registration is pending admin approval.';
        }

        if ($status === 'inactive') {
            return 'Your account is inactive.';
        }

        return null;
    }

    private function buildDisplayName(User $user): string
    {
        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        return is_string($user->name) && trim($user->name) !== ''
            ? trim($user->name)
            : 'Unnamed User';
    }

    private function supportsActiveSessionTracking(): bool
    {
        if (! Schema::hasTable('users')) {
            return false;
        }

        return Schema::hasColumn('users', 'active_session_id')
            && Schema::hasColumn('users', 'active_session_last_activity_at');
    }

    private function storeActiveSessionFingerprint(User $user, string $sessionId): void
    {
        if (! $this->supportsActiveSessionTracking() || $sessionId === '') {
            return;
        }

        User::withoutTimestamps(function () use ($user, $sessionId): void {
            $user->forceFill([
                'active_session_id' => $sessionId,
                'active_session_last_activity_at' => now(),
            ])->saveQuietly();
        });
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
}
