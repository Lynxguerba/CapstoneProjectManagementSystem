<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
use App\Models\SystemSetting;
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

        return Inertia::render('Admin/system-settings', [
            'settings' => [
                'academicYear' => (string) ($settings['academicYear'] ?? ''),
                'semester' => (string) ($settings['semester'] ?? '1st'),
                'titleProposalDeadline' => (string) ($settings['titleProposalDeadline'] ?? ''),
                'finalDefenseDeadline' => (string) ($settings['finalDefenseDeadline'] ?? ''),
                'siteWideNotification' => (string) ($settings['siteWideNotification'] ?? ''),
            ],
        ]);
    }

    public function update(UpdateSystemSettingsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        foreach (self::SETTINGS_KEYS as $key) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $validated[$key]]
            );
        }

        return redirect()->route('admin.system-settings')->with('success', 'System settings updated successfully.');
    }
}
