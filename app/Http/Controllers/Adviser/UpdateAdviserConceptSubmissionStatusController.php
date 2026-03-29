<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\UpdateAdviserConceptSubmissionStatusRequest;
use App\Models\DocumentSubmission;
use Illuminate\Http\RedirectResponse;

class UpdateAdviserConceptSubmissionStatusController extends Controller
{
    public function __invoke(UpdateAdviserConceptSubmissionStatusRequest $request, DocumentSubmission $submission): RedirectResponse
    {
        $submission->loadMissing(['group.adviserAssignment', 'requirement:id,stage']);

        $userId = $request->user()?->id;
        $assignedAdviserId = $submission->group?->adviserAssignment?->adviser_id;

        if ($userId === null || $assignedAdviserId === null || (int) $assignedAdviserId !== (int) $userId) {
            abort(403);
        }

        if (($submission->requirement?->stage ?? null) !== 'Concept') {
            abort(404);
        }

        $validated = $request->validated();
        $adviserStatus = (string) $validated['adviser_status'];

        $submission->update([
            'adviser_status' => $adviserStatus,
            'adviser_reviewed_by' => $userId,
            'adviser_reviewed_at' => now(),
        ]);

        $message = $adviserStatus === 'Approved'
            ? 'Concept submission approved as adviser.'
            : 'Concept submission marked for revision as adviser.';

        return back()->with('success', $message);
    }
}
