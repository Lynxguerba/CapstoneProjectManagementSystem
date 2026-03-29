<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\UpdatePanelistAvailabilityRequest;
use App\Models\PanelistAvailability;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;

class UpdatePanelistAvailabilityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdatePanelistAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();
        $activeRole = $request->session()->get('active_role');
        $isAuthorizedPanelist = $user && ($user->hasRole('panelist') || $activeRole === 'panelist');

        if (! $isAuthorizedPanelist) {
            abort(403);
        }

        if (! Schema::hasTable('panelist_availabilities')) {
            return back()->with('error', 'Panelist availability is not available yet.');
        }

        $data = $request->validated();

        PanelistAvailability::query()->updateOrCreate(
            ['panelist_id' => $user->id],
            ['is_available' => $data['is_available']],
        );

        return back()->with('success', 'Availability updated.');
    }
}
