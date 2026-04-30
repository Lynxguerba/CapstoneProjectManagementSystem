<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\StorePanelistConceptVerdictRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupDefenseVerdict;
use App\Models\GroupPanelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class StorePanelistConceptVerdictController extends Controller
{
    public function __invoke(StorePanelistConceptVerdictRequest $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null || ! $user->hasRole('panelist')) {
            abort(403);
        }

        $validated = $request->validated();
        $activeStage = $this->resolveRequestedStage($request);
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

        if (strtolower($activeStage) === 'concept') {
            return $this->storeConceptVerdict(
                $request,
                $groupId,
                $verdict,
                $approvedSubmissionId,
                $isPassedVerdict,
                $user->id,
                $activeStage,
            );
        }

        return $this->storeStageVerdict(
            $groupId,
            $verdict,
            $approvedSubmissionId,
            $isPassedVerdict,
            $user->id,
            $activeStage,
        );
    }

    private function storeConceptVerdict(
        Request $request,
        int $groupId,
        string $verdict,
        ?int $approvedSubmissionId,
        bool $isPassedVerdict,
        int $panelistUserId,
        string $activeStage,
    ): RedirectResponse {
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
            'concept_verdict_by_panelist_id' => $panelistUserId,
            'concept_verdict_decided_at' => now(),
            'approved_concept_submission_id' => $approvedSubmissionId,
        ]);

        return redirect()->route('panelist.live-defense', array_filter([
            'group' => $group->id,
            'stage' => $activeStage,
        ], static fn (mixed $value): bool => $value !== null))->with('success', 'Concept verdict saved successfully.');
    }

    private function storeStageVerdict(
        int $groupId,
        string $verdict,
        ?int $approvedSubmissionId,
        bool $isPassedVerdict,
        int $panelistUserId,
        string $activeStage,
    ): RedirectResponse {
        if (! Schema::hasTable('group_defense_verdicts')) {
            throw ValidationException::withMessages([
                'verdict' => 'Stage verdict records are not available yet. Please run migrations first.',
            ]);
        }

        $group = Group::query()->whereKey($groupId)->first(['id']);
        if (! $group instanceof Group) {
            abort(404);
        }

        if ($isPassedVerdict && $approvedSubmissionId === null) {
            throw ValidationException::withMessages([
                'approved_document_submission_id' => 'Select the approved document when verdict is a Passed option.',
            ]);
        }

        if (! $isPassedVerdict) {
            $approvedSubmissionId = null;
        }

        if ($approvedSubmissionId !== null) {
            $approvedSubmission = DocumentSubmission::query()
                ->with('requirement:id,stage,requirement_type')
                ->whereKey($approvedSubmissionId)
                ->where('group_id', $groupId)
                ->first(['id', 'group_id', 'document_requirement_id']);

            if (! $approvedSubmission instanceof DocumentSubmission) {
                throw ValidationException::withMessages([
                    'approved_document_submission_id' => 'Selected approved document must belong to this group.',
                ]);
            }

            if (($approvedSubmission->requirement?->stage ?? null) !== $activeStage) {
                throw ValidationException::withMessages([
                    'approved_document_submission_id' => 'Only documents from the selected defense stage can be used for this verdict.',
                ]);
            }

            if (strtolower($activeStage) === 'outline' && ! $this->isOutlineManuscriptSubmission($approvedSubmission)) {
                throw ValidationException::withMessages([
                    'approved_document_submission_id' => 'Only submitted outline manuscripts can be selected for this verdict.',
                ]);
            }
        }

        GroupDefenseVerdict::query()->updateOrCreate(
            [
                'group_id' => $groupId,
                'stage' => $activeStage,
            ],
            [
                'verdict' => $verdict,
                'approved_document_submission_id' => $approvedSubmissionId,
                'panelist_user_id' => $panelistUserId,
                'decided_at' => now(),
            ],
        );

        $stageLabel = strtolower($activeStage) === 'outline' ? 'Outline' : $activeStage;

        return redirect()->route('panelist.live-defense', [
            'group' => $group->id,
            'stage' => $activeStage,
        ])->with('success', "{$stageLabel} verdict saved successfully.");
    }

    private function resolveRequestedStage(Request $request): string
    {
        $stage = $request->input('stage');
        if (! is_string($stage)) {
            return 'Concept';
        }

        $normalizedStage = trim($stage);

        return $normalizedStage !== '' ? $normalizedStage : 'Concept';
    }

    private function isOutlineManuscriptSubmission(DocumentSubmission $submission): bool
    {
        $requirementType = strtolower(trim((string) $submission->requirement?->requirement_type));
        $requirementStage = strtolower(trim((string) $submission->requirement?->stage));

        if ($requirementStage !== 'outline') {
            return false;
        }

        return str_contains($requirementType, 'manuscript')
            || str_contains($requirementType, 'project outline')
            || $requirementType === 'outline';
    }
}
