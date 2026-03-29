<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\UpdateAdviserProgramUtilitiesRequest;
use App\Models\AdviserProgramUtility;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;

class UpdateAdviserProgramUtilitiesController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateAdviserProgramUtilitiesRequest $request): RedirectResponse
    {
        $user = $request->user();
        $activeRole = $request->session()->get('active_role');
        $isAuthorizedAdviser = $user && ($user->hasRole('adviser') || $activeRole === 'adviser');

        if (! $isAuthorizedAdviser) {
            abort(403);
        }

        if (! Schema::hasTable('adviser_program_utilities')) {
            return back()->with('error', 'Program utilities are not available yet.');
        }

        $data = $request->validated();

        $programs = collect($data['programs'])
            ->map(function (array $item): array {
                $program = is_string($item['program'] ?? null) ? trim($item['program']) : '';
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
            AdviserProgramUtility::query()->updateOrCreate(
                [
                    'adviser_id' => $user->id,
                    'program' => $item['program'],
                ],
                [
                    'max_groups' => $item['max_groups'],
                ],
            );
        }

        AdviserProgramUtility::query()
            ->where('adviser_id', $user->id)
            ->whereNotIn('program', $programs->pluck('program')->all())
            ->delete();

        return back()->with('success', 'Program utilities updated.');
    }
}
