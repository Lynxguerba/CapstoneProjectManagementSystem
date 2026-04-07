<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\UpsertPanelistEvaluationSheetSignatureRequest;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\PanelistEvaluationSheetSignature;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpsertPanelistEvaluationSheetSignatureController extends Controller
{
    public function __invoke(UpsertPanelistEvaluationSheetSignatureRequest $request): RedirectResponse
    {
        if (
            ! Schema::hasTable('panelist_evaluation_sheet_signatures')
            || ! Schema::hasColumns('panelist_evaluation_sheet_signatures', [
                'defense_date',
                'presenters',
                'individual_scores',
                'group_scores',
                'passing_grade_date',
            ])
        ) {
            throw ValidationException::withMessages([
                'group_id' => 'Evaluation sheet signature records are not available yet. Please run migrations first.',
            ]);
        }

        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $validated = $request->validated();
        $groupId = (int) $validated['group_id'];
        $panelistUserId = (int) $validated['panelist_user_id'];
        $defenseTypeKey = trim((string) $validated['defense_type_key']);
        $defenseDate = (string) $validated['defense_date'];
        $presenters = collect($validated['presenters'] ?? [])
            ->map(static fn (mixed $presenter): string => is_string($presenter) ? trim($presenter) : '')
            ->filter(static fn (string $presenter): bool => $presenter !== '')
            ->values()
            ->all();
        $individualScores = collect($validated['individual_scores'] ?? [])
            ->only(['disposition', 'organization', 'manner', 'defense'])
            ->map(static fn (mixed $score): ?int => is_numeric($score) ? (int) $score : null)
            ->all();
        $groupScores = collect($validated['group_scores'] ?? [])
            ->only(['system', 'documentation', 'total'])
            ->map(static fn (mixed $score): ?int => is_numeric($score) ? (int) $score : null)
            ->all();
        $passingGradeDate = is_string($validated['passing_grade_date'] ?? null) && trim((string) $validated['passing_grade_date']) !== ''
            ? (string) $validated['passing_grade_date']
            : null;

        if ($user->id !== $panelistUserId) {
            abort(403);
        }

        $user->loadMissing('eSignature');
        if ($user->eSignature === null) {
            throw ValidationException::withMessages([
                'panelist_user_id' => 'Set up your e-signature first before signing the evaluation sheet.',
            ]);
        }

        $group = Group::query()
            ->with('panelAssignments:id,group_id,panelist_id,panel_slot,role')
            ->whereKey($groupId)
            ->first(['id']);

        if (! $group instanceof Group) {
            abort(404);
        }

        $panelAssignment = $group->panelAssignments->firstWhere('panelist_id', $panelistUserId);
        $isPanelist = $panelAssignment instanceof GroupPanelist;
        if (! $isPanelist) {
            throw ValidationException::withMessages([
                'panelist_user_id' => 'Selected panelist is not assigned to this group.',
            ]);
        }

        $signedAt = now();
        PanelistEvaluationSheetSignature::query()->updateOrCreate(
            [
                'group_id' => $groupId,
                'defense_type_key' => $defenseTypeKey,
                'panelist_user_id' => $panelistUserId,
            ],
            [
                'defense_date' => $defenseDate,
                'presenters' => $presenters,
                'individual_scores' => $individualScores,
                'group_scores' => $groupScores,
                'passing_grade_date' => $passingGradeDate,
                'signed_at' => $signedAt,
                'signed_by_user_id' => $user->id,
            ],
        );

        return back()->with('success', 'Evaluation sheet signature saved successfully.');
    }
}
