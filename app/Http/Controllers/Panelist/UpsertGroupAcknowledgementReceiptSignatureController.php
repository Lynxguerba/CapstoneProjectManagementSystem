<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\UpsertGroupAcknowledgementReceiptSignatureRequest;
use App\Models\Group;
use App\Models\GroupAcknowledgementReceipt;
use App\Models\GroupPanelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpsertGroupAcknowledgementReceiptSignatureController extends Controller
{
    public function __invoke(UpsertGroupAcknowledgementReceiptSignatureRequest $request): RedirectResponse
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

        $user->loadMissing('eSignature');
        if ($user->eSignature === null) {
            throw ValidationException::withMessages([
                'faculty_user_id' => 'Set up your e-signature first before signing the acknowledgement receipt.',
            ]);
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

        $facultyRole = 'ADVISER';
        $amountReceived = 500;
        if ($isPanelist) {
            $panelRole = strtolower(trim((string) $panelAssignment->role));
            $isChairman = $panelRole === 'chairman' || (int) $panelAssignment->panel_slot === 1;
            $facultyRole = $isChairman ? 'PANEL CHAIRMAN' : 'PANEL MEMBER';
            $amountReceived = 300;
        }

        $signedAt = now();
        GroupAcknowledgementReceipt::query()->updateOrCreate(
            [
                'group_id' => $groupId,
                'defense_type_key' => $defenseTypeKey,
                'faculty_user_id' => $facultyUserId,
            ],
            [
                'faculty_role' => $facultyRole,
                'amount_received' => $amountReceived,
                'date_received' => $signedAt->toDateString(),
                'signed_at' => $signedAt,
                'signed_by_user_id' => $user->id,
            ],
        );

        return back()->with('success', 'Acknowledgement signature saved successfully.');
    }
}
