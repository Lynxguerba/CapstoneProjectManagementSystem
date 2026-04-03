<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\UndoPanelistConceptTitleApprovalRequest;
use App\Models\Group;
use App\Models\GroupPanelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UndoPanelistConceptTitleApprovalController extends Controller
{
    public function __invoke(UndoPanelistConceptTitleApprovalRequest $request): RedirectResponse
    {
        if (! Schema::hasTable('groups') || ! Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            throw ValidationException::withMessages([
                'group_id' => 'Concept title approval is not available yet. Please run migrations first.',
            ]);
        }

        $user = $request->user();
        if ($user === null || ! $user->hasRole('panelist')) {
            abort(403);
        }

        $validated = $request->validated();
        $groupId = (int) $validated['group_id'];
        $panelAssignment = GroupPanelist::query()
            ->where('group_id', $groupId)
            ->where('panelist_id', $user->id)
            ->first(['id', 'role', 'panel_slot']);

        $panelRole = is_string($panelAssignment?->role) ? strtolower(trim($panelAssignment->role)) : '';
        $isChairman = $panelRole === 'chairman' || (int) ($panelAssignment?->panel_slot ?? 0) === 1;
        if (! $panelAssignment instanceof GroupPanelist || ! $isChairman) {
            abort(403);
        }

        $group = Group::query()->whereKey($groupId)->first(['id', 'approved_concept_submission_id']);
        if (! $group instanceof Group) {
            abort(404);
        }

        $group->update([
            'approved_concept_submission_id' => null,
        ]);

        return redirect()->route('panelist.live-defense', [
            'group' => $group->id,
        ])->with('success', 'Concept title approval has been undone.');
    }
}
