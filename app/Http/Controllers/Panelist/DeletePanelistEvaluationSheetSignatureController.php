<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\DeletePanelistEvaluationSheetSignatureRequest;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\PanelistEvaluationSheetSignature;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class DeletePanelistEvaluationSheetSignatureController extends Controller
{
    public function __invoke(DeletePanelistEvaluationSheetSignatureRequest $request): RedirectResponse
    {
        if (! Schema::hasTable('panelist_evaluation_sheet_signatures')) {
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

        if ($user->id !== $panelistUserId) {
            abort(403);
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

        PanelistEvaluationSheetSignature::query()
            ->where('group_id', $groupId)
            ->where('defense_type_key', $defenseTypeKey)
            ->where('panelist_user_id', $panelistUserId)
            ->update([
                'signed_at' => null,
                'signed_by_user_id' => null,
            ]);

        return back()->with('success', 'Evaluation sheet signature removed.');
    }
}
