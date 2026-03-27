<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\UpdateAdviserAvailabilityRequest;
use App\Models\AdviserAvailability;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;

class UpdateAdviserAvailabilityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateAdviserAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('adviser')) {
            abort(403);
        }

        if (! Schema::hasTable('adviser_availabilities')) {
            return back()->with('error', 'Adviser availability is not available yet.');
        }

        $data = $request->validated();

        AdviserAvailability::query()->updateOrCreate(
            ['adviser_id' => $user->id],
            ['is_available' => $data['is_available']],
        );

        return back()->with('success', 'Availability updated.');
    }
}
