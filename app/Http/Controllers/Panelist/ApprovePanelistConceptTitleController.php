<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\ApprovePanelistConceptTitleRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ApprovePanelistConceptTitleController extends Controller
{
    public function __invoke(ApprovePanelistConceptTitleRequest $request): RedirectResponse
    {
        if (! Schema::hasTable('groups') || ! Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            throw ValidationException::withMessages([
                'document_submission_id' => 'Concept title approval is not available yet. Please run migrations first.',
            ]);
        }

        $user = $request->user();
        if ($user === null || ! $user->hasRole('panelist')) {
            abort(403);
        }

        $validated = $request->validated();
        $submissionId = (int) $validated['document_submission_id'];
        $submission = DocumentSubmission::query()
            ->with('requirement:id,stage')
            ->whereKey($submissionId)
            ->first(['id', 'group_id', 'document_requirement_id']);

        if (! $submission instanceof DocumentSubmission) {
            throw ValidationException::withMessages([
                'document_submission_id' => 'Selected concept submission is not available.',
            ]);
        }

        if (($submission->requirement?->stage ?? null) !== 'Concept') {
            throw ValidationException::withMessages([
                'document_submission_id' => 'Only concept title submissions can be approved.',
            ]);
        }

        $panelAssignment = GroupPanelist::query()
            ->where('group_id', $submission->group_id)
            ->where('panelist_id', $user->id)
            ->first(['id', 'role', 'panel_slot']);

        $panelRole = is_string($panelAssignment?->role) ? strtolower(trim($panelAssignment->role)) : '';
        $isChairman = $panelRole === 'chairman' || (int) ($panelAssignment?->panel_slot ?? 0) === 1;
        if (! $panelAssignment instanceof GroupPanelist || ! $isChairman) {
            abort(403);
        }

        $group = Group::query()
            ->whereKey($submission->group_id)
            ->first(['id', 'approved_concept_submission_id']);

        if (! $group instanceof Group) {
            abort(404);
        }

        $group->update([
            'approved_concept_submission_id' => $submission->id,
        ]);

        return redirect()->route('panelist.live-defense', [
            'group' => $group->id,
        ])->with('success', 'Concept title approved successfully.');
    }
}
