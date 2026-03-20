<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\GroupAdviserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DismissGroupAdviserRequestController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, GroupAdviserRequest $assignmentRequest): RedirectResponse
    {
        $userId = $request->user()?->id;

        if (! $userId || $assignmentRequest->adviser_id !== $userId) {
            abort(403);
        }

        if ($assignmentRequest->status !== GroupAdviserRequest::STATUS_PENDING) {
            return back()->with('error', 'Request is no longer pending.');
        }

        $nextStatus = $assignmentRequest->request_type === GroupAdviserRequest::TYPE_REQUEST
            ? GroupAdviserRequest::STATUS_REJECTED
            : GroupAdviserRequest::STATUS_DISMISSED;

        $assignmentRequest->forceFill([
            'status' => $nextStatus,
            'responded_by' => $userId,
            'responded_at' => now(),
        ])->save();

        $message = $assignmentRequest->request_type === GroupAdviserRequest::TYPE_REQUEST
            ? 'Assignment request declined.'
            : 'Reassignment notice removed.';

        return back()->with('success', $message);
    }
}
