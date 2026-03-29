<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDocumentSubmissionStatusRequest;
use App\Models\DocumentSubmission;
use Illuminate\Http\RedirectResponse;

class UpdateDocumentSubmissionStatusController extends Controller
{
    public function __invoke(UpdateDocumentSubmissionStatusRequest $request, DocumentSubmission $submission): RedirectResponse
    {
        $submission->loadMissing(['group.programSet', 'requirement:id,stage']);

        $userId = $request->user()?->id;
        $programSet = $submission->group?->programSet;

        if ($userId === null || $programSet?->instructor_id !== $userId) {
            abort(403);
        }

        if (($submission->requirement?->stage ?? null) !== 'Concept') {
            abort(404);
        }

        $data = $request->validated();
        $status = (string) $data['status'];

        $submission->update([
            'status' => $status,
        ]);

        $message = $status === 'Approved'
            ? 'Concept submission approved successfully.'
            : 'Concept submission marked for resubmission.';

        return back()->with('success', $message);
    }
}
