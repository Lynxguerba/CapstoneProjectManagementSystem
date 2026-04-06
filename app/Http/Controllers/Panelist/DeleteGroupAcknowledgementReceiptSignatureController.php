<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\DeleteGroupAcknowledgementReceiptSignatureRequest;
use App\Models\Group;
use App\Models\GroupAcknowledgementReceipt;
use App\Models\GroupPanelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class DeleteGroupAcknowledgementReceiptSignatureController extends Controller
{
    public function __invoke(DeleteGroupAcknowledgementReceiptSignatureRequest $request): RedirectResponse
    {
        if (! Schema::hasTable('group_acknowledgement_receipts')) {
            throw ValidationException::withMessages([
                'group_id' => 'Acknowledgement receipt records are not available yet. Please run migrations first.',
            ]);
        }

        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $validated = $request->validated();
        $groupId = (int) $validated['group_id'];
        $facultyUserId = (int) $validated['faculty_user_id'];
        $defenseTypeKey = trim((string) $validated['defense_type_key']);

        if ($user->id !== $facultyUserId) {
            abort(403);
        }

        $group = Group::query()
            ->with([
                'adviserAssignment:id,group_id,adviser_id',
                'panelAssignments:id,group_id,panelist_id,panel_slot,role',
            ])
            ->whereKey($groupId)
            ->first(['id']);

        if (! $group instanceof Group) {
            abort(404);
        }

        $isAdviser = (int) ($group->adviserAssignment?->adviser_id ?? 0) === $facultyUserId;
        $panelAssignment = $group->panelAssignments->firstWhere('panelist_id', $facultyUserId);
        $isPanelist = $panelAssignment instanceof GroupPanelist;
        if (! $isAdviser && ! $isPanelist) {
            throw ValidationException::withMessages([
                'faculty_user_id' => 'Selected faculty is not assigned to this group.',
            ]);
        }

        GroupAcknowledgementReceipt::query()
            ->where('group_id', $groupId)
            ->where('defense_type_key', $defenseTypeKey)
            ->where('faculty_user_id', $facultyUserId)
            ->update([
                'signed_at' => null,
                'signed_by_user_id' => null,
            ]);

        return back()->with('success', 'Acknowledgement signature removed.');
    }
}
