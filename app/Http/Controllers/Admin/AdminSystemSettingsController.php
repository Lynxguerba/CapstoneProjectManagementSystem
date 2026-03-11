<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminSystemSettingsController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const SETTINGS_KEYS = [
        'academicYear',
        'semester',
        'titleProposalDeadline',
        'finalDefenseDeadline',
        'siteWideNotification',
    ];

    public function edit(): Response
    {
        $settings = SystemSetting::query()
            ->whereIn('key', self::SETTINGS_KEYS)
            ->pluck('value', 'key');

        $adminUsers = User::query()
            ->with('roles:id,slug')
            ->where(function (Builder $query): void {
                $query
                    ->whereHas('roles', function (Builder $roleQuery): void {
                        $roleQuery->where('slug', 'admin');
                    })
                    ->orWhere('role', 'like', '%admin%');
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->orderBy('name')
            ->get(['id', 'name', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at'])
            ->map(function (User $user): array {
                $roleSlugs = $user->roleSlugs();
                $role = is_string($user->role) && $user->role !== ''
                    ? $user->role
                    : ($roleSlugs[0] ?? 'admin');
                $resolvedRoles = count($roleSlugs) > 0 ? $roleSlugs : [$role];
                $status = is_string($user->status) && $user->status !== '' ? $user->status : 'active';
                $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
                $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
                $fullName = $this->buildFullName($firstName, $lastName, $user->name);

                return [
                    'id' => $user->id,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'fullName' => $fullName,
                    'email' => $user->email,
                    'role' => $role,
                    'roles' => $resolvedRoles,
                    'status' => $status,
                    'createdAt' => $user->created_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values();

        return Inertia::render('Admin/system-settings', [
            'settings' => [
                'academicYear' => (string) ($settings['academicYear'] ?? ''),
                'semester' => (string) ($settings['semester'] ?? '1st'),
                'titleProposalDeadline' => (string) ($settings['titleProposalDeadline'] ?? ''),
                'finalDefenseDeadline' => (string) ($settings['finalDefenseDeadline'] ?? ''),
                'siteWideNotification' => (string) ($settings['siteWideNotification'] ?? ''),
            ],
            'adminUsers' => $adminUsers,
        ]);
    }

    public function update(UpdateSystemSettingsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        foreach (self::SETTINGS_KEYS as $key) {
            if (! array_key_exists($key, $validated)) {
                continue;
            }

            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) ($validated[$key] ?? '')]
            );
        }

        return redirect()->route('admin.system-settings')->with('success', 'System settings updated successfully.');
    }

    private function buildFullName(string $firstName, string $lastName, ?string $fallbackName): string
    {
        if ($firstName !== '' || $lastName !== '') {
            return trim($lastName.', '.$firstName, ', ');
        }

        return is_string($fallbackName) ? $fallbackName : '';
    }
}
