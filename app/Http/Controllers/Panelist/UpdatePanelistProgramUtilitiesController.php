<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\UpdatePanelistProgramUtilitiesRequest;
use App\Models\PanelistProgramUtility;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UpdatePanelistProgramUtilitiesController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdatePanelistProgramUtilitiesRequest $request): RedirectResponse
    {
        $user = $request->user();
        $activeRole = $request->session()->get('active_role');
        $isAuthorizedPanelist = $user && ($user->hasRole('panelist') || $activeRole === 'panelist');

        if (! $isAuthorizedPanelist) {
            abort(403);
        }

        if (! Schema::hasTable('panelist_program_utilities')) {
            return back()->with('error', 'Program utilities are not available yet.');
        }

        $data = $request->validated();

        $programs = collect($data['programs'])
            ->map(function (array $item): array {
                $program = is_string($item['program'] ?? null) ? Str::upper(trim($item['program'])) : '';
                $maxGroups = (int) ($item['max_groups'] ?? 0);

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                ];
            })
            ->filter(fn (array $item): bool => $item['program'] !== '')
            ->unique('program')
            ->values();

        foreach ($programs as $item) {
            PanelistProgramUtility::query()->updateOrCreate(
                [
                    'panelist_id' => $user->id,
                    'program' => $item['program'],
                ],
                [
                    'max_groups' => $item['max_groups'],
                ],
            );
        }

        PanelistProgramUtility::query()
            ->where('panelist_id', $user->id)
            ->whereNotIn('program', $programs->pluck('program')->all())
            ->delete();

        return back()->with('success', 'Program utilities updated.');
    }
}
