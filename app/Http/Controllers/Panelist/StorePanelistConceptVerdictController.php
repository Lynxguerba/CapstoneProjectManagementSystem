<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\StorePanelistConceptVerdictRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class StorePanelistConceptVerdictController extends Controller
{
    public function __invoke(StorePanelistConceptVerdictRequest $request): RedirectResponse
    {
        if (
            ! Schema::hasTable('groups')
            || ! Schema::hasColumn('groups', 'approved_concept_submission_id')
            || ! Schema::hasColumn('groups', 'concept_verdict')
            || ! Schema::hasColumn('groups', 'concept_verdict_by_panelist_id')
            || ! Schema::hasColumn('groups', 'concept_verdict_decided_at')
        ) {
            throw ValidationException::withMessages([
                'verdict' => 'Concept verdict is not available yet. Please run migrations first.',
            ]);
        }

        $user = $request->user();
        if ($user === null || ! $user->hasRole('panelist')) {
            abort(403);
        }

        $validated = $request->validated();
        $groupId = (int) $validated['group_id'];
        $verdict = trim((string) $validated['verdict']);
        if ($verdict === 'Pass with revision') {
            $verdict = 'Passed (With revisions needed)';
        }
        if ($verdict === 'Conditional Pass') {
            $verdict = 'Conditional Passed';
        }
        $approvedSubmissionId = is_numeric($validated['approved_document_submission_id'] ?? null)
            ? (int) $validated['approved_document_submission_id']
            : null;
        $isPassedVerdict = in_array($verdict, [
            'Passed (No revisions needed)',
            'Passed (With revisions needed)',
        ], true);

        $panelAssignment = GroupPanelist::query()
            ->where('group_id', $groupId)
            ->where('panelist_id', $user->id)
            ->first(['id', 'role', 'panel_slot']);
        $panelRole = is_string($panelAssignment?->role) ? strtolower(trim($panelAssignment->role)) : '';
        $isChairman = $panelRole === 'chairman' || (int) ($panelAssignment?->panel_slot ?? 0) === 1;
        if (! $panelAssignment instanceof GroupPanelist || ! $isChairman) {
            abort(403);
        }

        $group = Group::query()
            ->whereKey($groupId)
            ->first([
                'id',
                'approved_concept_submission_id',
                'concept_verdict',
                'concept_verdict_by_panelist_id',
                'concept_verdict_decided_at',
            ]);
        if (! $group instanceof Group) {
            abort(404);
        }

        if ($isPassedVerdict && $approvedSubmissionId === null) {
            throw ValidationException::withMessages([
                'approved_document_submission_id' => 'Select the approved concept title when verdict is a Passed option.',
            ]);
        }

        if (! $isPassedVerdict) {
            $approvedSubmissionId = null;
        }

        if ($approvedSubmissionId !== null) {
            $approvedSubmission = DocumentSubmission::query()
                ->with('requirement:id,stage')
                ->whereKey($approvedSubmissionId)
                ->where('group_id', $groupId)
                ->first(['id', 'group_id', 'document_requirement_id']);

            if (! $approvedSubmission instanceof DocumentSubmission) {
                throw ValidationException::withMessages([
                    'approved_document_submission_id' => 'Selected approved concept title must belong to this group.',
                ]);
            }

            if (($approvedSubmission->requirement?->stage ?? null) !== 'Concept') {
                throw ValidationException::withMessages([
                    'approved_document_submission_id' => 'Only concept title submissions can be selected for this verdict.',
                ]);
            }
        }

        $group->update([
            'concept_verdict' => $verdict,
            'concept_verdict_by_panelist_id' => $user->id,
            'concept_verdict_decided_at' => now(),
            'approved_concept_submission_id' => $approvedSubmissionId,
        ]);

        $activeStage = $this->resolveRequestedStage($request);

        return redirect()->route('panelist.live-defense', array_filter([
            'group' => $group->id,
            'stage' => $activeStage,
        ], static fn (mixed $value): bool => $value !== null))->with('success', 'Concept verdict saved successfully.');
    }

    private function resolveRequestedStage(Request $request): ?string
    {
        $stage = $request->input('stage');
        if (! is_string($stage)) {
            return null;
        }

        $normalizedStage = trim($stage);

        return $normalizedStage !== '' ? $normalizedStage : null;
    }
}
