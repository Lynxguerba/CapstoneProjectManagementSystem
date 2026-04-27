<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\UpdateAdviserManuscriptSubmissionStatusRequest;
use App\Models\DocumentSubmission;
use Illuminate\Http\RedirectResponse;

class UpdateAdviserManuscriptSubmissionStatusController extends Controller
{
    public function __invoke(
        UpdateAdviserManuscriptSubmissionStatusRequest $request,
        DocumentSubmission $submission,
    ): RedirectResponse {
        $submission->loadMissing(['group.adviserAssignment', 'requirement:id,stage,requirement_type']);

        $userId = $request->user()?->id;
        $assignedAdviserId = $submission->group?->adviserAssignment?->adviser_id;

        if ($userId === null || $assignedAdviserId === null || (int) $assignedAdviserId !== (int) $userId) {
            abort(403);
        }

        if (! $this->isOutlineManuscriptRequirement($submission->requirement?->requirement_type, $submission->requirement?->stage)) {
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
            ? 'Manuscript approved as adviser.'
            : 'Manuscript marked for revision as adviser.';

        return back()->with('success', $message);
    }

    private function isOutlineManuscriptRequirement(?string $requirementType, ?string $stage): bool
    {
        if (strtolower(trim((string) $stage)) !== 'outline') {
            return false;
        }

        $normalizedRequirementType = strtolower(trim((string) $requirementType));

        return str_contains($normalizedRequirementType, 'manuscript')
            || str_contains($normalizedRequirementType, 'project outline')
            || $normalizedRequirementType === 'outline';
    }
}
