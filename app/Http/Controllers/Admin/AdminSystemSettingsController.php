<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
use App\Models\AcademicYear;
use App\Models\SiteWideNotification;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
    ];

    public function edit(): Response
    {
        $settings = SystemSetting::query()
            ->whereIn('key', self::SETTINGS_KEYS)
            ->pluck('value', 'key');

        $currentAcademicYear = null;

        if (Schema::hasTable('academic_years')) {
            $currentAcademicYear = AcademicYear::query()
                ->where('is_current', true)
                ->value('label');
        }

        $siteWideNotification = null;

        if (Schema::hasTable('site_wide_notifications')) {
            $siteWideNotification = SiteWideNotification::query()
                ->latest('id')
                ->value('message');
        } else {
            $siteWideNotification = SystemSetting::query()
                ->where('key', 'siteWideNotification')
                ->value('value');
        }

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
                'academicYear' => (string) ($currentAcademicYear ?? $settings['academicYear'] ?? ''),
                'semester' => (string) ($settings['semester'] ?? '1st'),
                'titleProposalDeadline' => (string) ($settings['titleProposalDeadline'] ?? ''),
                'finalDefenseDeadline' => (string) ($settings['finalDefenseDeadline'] ?? ''),
                'siteWideNotification' => (string) ($siteWideNotification ?? ''),
            ],
            'adminUsers' => $adminUsers,
        ]);
    }

    public function update(UpdateSystemSettingsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if (array_key_exists('siteWideNotification', $validated)) {
            if (! Schema::hasTable('site_wide_notifications')) {
                return back()
                    ->withErrors(['siteWideNotification' => 'Site-wide notifications table is missing. Run migrations first.'])
                    ->withInput();
            }

            $message = trim((string) ($validated['siteWideNotification'] ?? ''));
            $message = $message !== '' ? $message : null;

            $notification = SiteWideNotification::query()
                ->latest('id')
                ->first();

            if ($notification !== null) {
                $notification->update(['message' => $message]);
            } else {
                SiteWideNotification::query()->create(['message' => $message]);
            }
        }

        $academicYearLabel = null;

        if (array_key_exists('academicYear', $validated)) {
            $parsedAcademicYear = $this->parseAcademicYearLabel((string) $validated['academicYear']);

            if ($parsedAcademicYear !== null) {
                [$startYear, $endYear, $label] = $parsedAcademicYear;
                $academicYearLabel = $label;

                if (Schema::hasTable('academic_years')) {
                    $this->setCurrentAcademicYear($startYear, $endYear, $label);
                }
            }
        }

        foreach (self::SETTINGS_KEYS as $key) {
            if (! array_key_exists($key, $validated)) {
                continue;
            }

            $value = (string) ($validated[$key] ?? '');

            if ($key === 'academicYear' && is_string($academicYearLabel) && $academicYearLabel !== '') {
                $value = $academicYearLabel;
            }

            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value]
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

    /**
     * @return array{0:int,1:int,2:string}|null
     */
    private function parseAcademicYearLabel(string $label): ?array
    {
        $normalized = str_replace('–', '-', trim($label));

        if (! preg_match('/^(?<start>\\d{4})-(?<end>\\d{4})$/', $normalized, $matches)) {
            return null;
        }

        $startYear = (int) $matches['start'];
        $endYear = (int) $matches['end'];

        if ($endYear <= $startYear) {
            return null;
        }

        return [$startYear, $endYear, $normalized];
    }

    private function setCurrentAcademicYear(int $startYear, int $endYear, string $label): void
    {
        DB::transaction(function () use ($startYear, $endYear, $label): void {
            $academicYear = AcademicYear::query()->updateOrCreate(
                [
                    'start_year' => $startYear,
                    'end_year' => $endYear,
                ],
                [
                    'label' => $label,
                    'is_current' => true,
                ]
            );

            AcademicYear::query()
                ->whereKeyNot($academicYear->getKey())
                ->where('is_current', true)
                ->update(['is_current' => false]);
        });
    }
}
