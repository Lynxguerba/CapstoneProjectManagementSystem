<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StoreSelfRegistrationRequest;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\StudentProgram;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LoginController extends Controller
{
    private const SESSION_CONFLICT_MESSAGE = 'The user you entered is already logged in on another browser.';

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

    /**
     * @var array<int, string>
     */
    private const FACULTY_ROLES = [
        'admin',
        'adviser',
        'panelist',
        'instructor',
        'dean',
        'program_chairperson',
    ];

    /**
     * @var array<int, string>
     */
    private const SELF_REGISTRATION_ROLES = [
        'student',
        'adviser',
        'panelist',
        'instructor',
        'dean',
        'program_chairperson',
    ];

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::query()->with('roles:id,slug')->where('email', $request->email)->first();

        if (! $user || ! $this->passwordMatches($user, (string) $request->input('password'))) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        $blockedLoginMessage = $this->resolveBlockedLoginMessage($user);

        if ($blockedLoginMessage !== null) {
            return back()->withErrors([
                'email' => $blockedLoginMessage,
            ]);
        }

        if ($this->hasAnotherActiveSession($user, $request)) {
            return back()->withErrors([
                'email' => self::SESSION_CONFLICT_MESSAGE,
            ]);
        }

        $requestedRole = $this->resolveLoginRole($user);

        if ($requestedRole === null) {
            return back()->withErrors([
                'email' => 'Your account does not have a valid role assignment.',
            ]);
        }

        if ($user->role !== $requestedRole) {
            $user->forceFill([
                'role' => $requestedRole,
            ])->save();
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('active_role', $requestedRole);
        $this->storeActiveSessionFingerprint($user, (string) $request->session()->getId());
        $this->recordLoginAudit($user, $request, $requestedRole);
        Inertia::clearHistory();

        return redirect()->route(self::ROLE_DASHBOARD_ROUTES[$requestedRole]);
    }

    public function register(StoreSelfRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $requestedRole = Role::normalizeRole($validated['role']);

        if ($requestedRole === null || ! in_array($requestedRole, self::SELF_REGISTRATION_ROLES, true)) {
            return back()->withErrors([
                'role' => 'The selected role is not available for self-registration.',
            ]);
        }

        $userAttributes = [
            'name' => $this->buildDisplayName($validated['first_name'], $validated['last_name']),
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'role' => $requestedRole,
            'status' => 'pending',
            'password' => $validated['password'],
        ];

        if ($this->hasUsersProgramColumn()) {
            $userAttributes['program'] = $this->normalizeProgramCode($validated['program'] ?? null);
        }

        $user = User::query()->create($userAttributes);

        $user->syncRoles([$requestedRole]);
        $this->syncStudentProfile($user, $validated['program'] ?? null, $requestedRole === 'student');

        return redirect()
            ->route('login')
            ->with('success', 'Registration request submitted. Wait for admin approval before signing in.');
    }

    private function resolveLoginRole(User $user): ?string
    {
        $storedRole = Role::normalizeRole((string) $user->role);

        if ($storedRole !== null && $this->canAccessRequestedRole($user, $storedRole)) {
            return $storedRole;
        }

        $assignedRole = collect($user->roleSlugs())
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter(fn (?string $role): bool => $role !== null)
            ->first(fn (string $role): bool => $this->canAccessRequestedRole($user, $role));

        if (is_string($assignedRole)) {
            return $assignedRole;
        }

        $legacyRole = collect(explode(',', (string) $user->role))
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter(fn (?string $role): bool => $role !== null)
            ->first(fn (string $role): bool => $this->canAccessRequestedRole($user, $role));

        return is_string($legacyRole) ? $legacyRole : null;
    }

    private function resolveBlockedLoginMessage(User $user): ?string
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

    private function hasAnotherActiveSession(User $user, Request $request): bool
    {
        if (! $this->supportsActiveSessionTracking()) {
            return false;
        }

        $storedSessionId = is_string($user->active_session_id ?? null)
            ? trim((string) $user->active_session_id)
            : '';

        if ($storedSessionId === '') {
            return false;
        }

        $currentSessionId = (string) $request->session()->getId();

        if ($storedSessionId === $currentSessionId) {
            return false;
        }

        if ($this->sessionLockExpired($user)) {
            $this->clearStoredActiveSession($user);

            return false;
        }

        return true;
    }

    public function logout(Request $request): RedirectResponse
    {
        $user = Auth::guard('web')->user();
        if ($user instanceof User) {
            $this->recordLogoutAudit($user, $request);
            $this->clearStoredActiveSessionIfOwnedBySession($user, (string) $request->session()->getId());
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        Inertia::clearHistory();

        return redirect()->route('login');
    }

    public function switchRole(Request $request): RedirectResponse
    {
        $request->validate([
            'role' => ['required', 'string'],
        ]);

        $requestedRole = Role::normalizeRole((string) $request->input('role'));

        if ($requestedRole === null || ! array_key_exists($requestedRole, self::ROLE_DASHBOARD_ROUTES)) {
            return back()->withErrors([
                'role' => 'The selected role is not configured for dashboard access.',
            ]);
        }

        $user = Auth::guard('web')->user();

        if (! $user instanceof User || ! $user->hasRole($requestedRole)) {
            return back()->withErrors([
                'role' => 'You are not assigned to the selected role.',
            ]);
        }

        if ($user->role !== $requestedRole) {
            $user->forceFill([
                'role' => $requestedRole,
            ])->save();
        }

        $request->session()->put('active_role', $requestedRole);
        $request->session()->regenerate();
        $this->storeActiveSessionFingerprint($user, (string) $request->session()->getId());

        Inertia::clearHistory();

        return redirect()->route(self::ROLE_DASHBOARD_ROUTES[$requestedRole]);
    }

    private function canAccessRequestedRole(User $user, string $requestedRole): bool
    {
        if ($user->hasRole($requestedRole)) {
            return true;
        }

        if (! in_array($requestedRole, self::FACULTY_ROLES, true)) {
            return false;
        }

        $normalizedActiveRole = Str::of((string) $user->role)
            ->trim()
            ->lower()
            ->replace('-', '_')
            ->replace(' ', '_')
            ->value();

        if ($normalizedActiveRole === 'faculty') {
            return true;
        }

        return collect(self::FACULTY_ROLES)->contains(
            fn (string $role): bool => $role !== 'student' && $user->hasRole($role)
        );
    }

    private function passwordMatches(User $user, string $plainPassword): bool
    {
        if (Hash::check($plainPassword, (string) $user->password)) {
            return true;
        }

        if ((string) $user->password !== $plainPassword) {
            return false;
        }

        $user->forceFill([
            'password' => $plainPassword,
        ])->save();

        return true;
    }

    private function buildDisplayName(string $firstName, string $lastName): string
    {
        return trim($firstName.' '.$lastName);
    }

    private function supportsActiveSessionTracking(): bool
    {
        if (! Schema::hasTable('users')) {
            return false;
        }

        return Schema::hasColumn('users', 'active_session_id')
            && Schema::hasColumn('users', 'active_session_last_activity_at');
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

        $this->clearStoredActiveSession($user);
    }

    private function clearStoredActiveSession(User $user): void
    {
        if (! $this->supportsActiveSessionTracking()) {
            return;
        }

        User::withoutTimestamps(function () use ($user): void {
            $user->forceFill([
                'active_session_id' => null,
                'active_session_last_activity_at' => null,
            ])->saveQuietly();
        });
    }

    private function normalizeProgramCode(mixed $programCode): ?string
    {
        if (! is_string($programCode) || trim($programCode) === '') {
            return null;
        }

        $normalizedCode = strtoupper(trim($programCode));

        if (! in_array($normalizedCode, ['BSIT', 'BSIS'], true)) {
            return null;
        }

        return $normalizedCode;
    }

    private function syncStudentProfile(User $user, mixed $programCode, bool $isStudent): void
    {
        if (! Schema::hasTable('student_program')) {
            return;
        }

        if (! $isStudent) {
            $user->studentProgram()->delete();

            return;
        }

        $resolvedProgram = $this->normalizeProgramCode($programCode);

        if ($resolvedProgram === null) {
            $user->studentProgram()->delete();

            return;
        }

        StudentProgram::query()->updateOrCreate(
            ['student_id' => $user->id],
            ['program' => $resolvedProgram]
        );
    }

    private function hasUsersProgramColumn(): bool
    {
        return Schema::hasTable('users') && Schema::hasColumn('users', 'program');
    }

    private function recordLoginAudit(User $user, Request $request, string $requestedRole): void
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
                'action' => 'User Login',
                'entity' => 'Authentication',
                'severity' => 'info',
                'route_name' => $request->route()?->getName(),
                'http_method' => $request->method(),
                'status_code' => 302,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => 'User logged in successfully.',
                'metadata' => [
                    'active_role' => $requestedRole,
                    'assigned_roles' => $user->roleSlugs(),
                ],
            ]);
        } catch (\Throwable $e) {
            return;
        }
    }

    private function recordLogoutAudit(User $user, Request $request): void
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
                'action' => 'User Logout',
                'entity' => 'Authentication',
                'severity' => 'info',
                'route_name' => $request->route()?->getName(),
                'http_method' => $request->method(),
                'status_code' => 302,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => 'User logged out successfully.',
                'metadata' => [
                    'active_role' => $request->session()->get('active_role'),
                    'assigned_roles' => $user->roleSlugs(),
                ],
            ]);
        } catch (\Throwable $e) {
            return;
        }
    }
}
