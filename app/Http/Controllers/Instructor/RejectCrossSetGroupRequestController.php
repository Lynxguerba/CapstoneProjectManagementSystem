<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\CrossSetGroupRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RejectCrossSetGroupRequestController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, CrossSetGroupRequest $crossSetRequest): RedirectResponse
    {
        $userId = $request->user()?->id;
        if (! $userId || $crossSetRequest->requested_to !== $userId) {
            abort(403);
        }

        if (! $crossSetRequest->isPending()) {
            abort(422, 'Cross-set request is no longer pending.');
        }

        $validated = $request->validate([
            'remarks' => ['nullable', 'string'],
        ]);

        $crossSetRequest->forceFill([
            'status' => 'rejected',
            'remarks' => $validated['remarks'] ?? null,
            'responded_at' => now(),
        ])->save();

        return back()->with('success', 'Cross-set request rejected.');
    }
}
