<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignGroupPanelistRequest;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class AssignGroupPanelistController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(AssignGroupPanelistRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $group = Group::query()
            ->with(['programSet', 'panelAssignments'])
            ->whereKey($data['group_id'])
            ->firstOrFail();

        $userId = $request->user()?->id;
        if ($userId !== null && $group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $panelist = User::query()->whereKey($data['panelist_id'])->firstOrFail();
        if (! $panelist->hasRole('panelist')) {
            throw ValidationException::withMessages([
                'panelist_id' => 'Selected user is not a panelist.',
            ]);
        }

        $currentAssignments = $group->panelAssignments;
        $panelRole = $data['panel_role'];
        $chairmanCount = $currentAssignments->where('role', 'chairman')->count();
        $memberCount = $currentAssignments->where('role', 'member')->count();

        $currentAssignment = $currentAssignments->firstWhere('panelist_id', $panelist->id);
        if ($currentAssignment !== null) {
            if ($currentAssignment->role === $panelRole) {
                return back()->with('success', 'Panelist already assigned to this group.');
            }

            $adjustedChairmanCount = $chairmanCount - ($currentAssignment->role === 'chairman' ? 1 : 0);
            $adjustedMemberCount = $memberCount - ($currentAssignment->role === 'member' ? 1 : 0);

            if ($panelRole === 'chairman' && $adjustedChairmanCount >= 1) {
                throw ValidationException::withMessages([
                    'panel_role' => 'This group already has a panel chairman.',
                ]);
            }

            if ($panelRole === 'member' && $adjustedMemberCount >= 2) {
                throw ValidationException::withMessages([
                    'panel_role' => 'This group already has two panel members.',
                ]);
            }

            $currentAssignment->update([
                'role' => $panelRole,
                'assigned_by' => $userId,
            ]);

            return back()->with('success', 'Panelist role updated successfully.');
        }

        $replacePanelistId = $data['replace_panelist_id'] ?? null;
        if (is_int($replacePanelistId) || is_string($replacePanelistId)) {
            $replacePanelistId = (int) $replacePanelistId;

            $replaceAssignment = $currentAssignments->firstWhere('panelist_id', $replacePanelistId);
            if ($replaceAssignment === null) {
                throw ValidationException::withMessages([
                    'replace_panelist_id' => 'Selected panelist is not assigned to this group.',
                ]);
            }

            $adjustedChairmanCount = $chairmanCount - ($replaceAssignment->role === 'chairman' ? 1 : 0);
            $adjustedMemberCount = $memberCount - ($replaceAssignment->role === 'member' ? 1 : 0);

            if ($panelRole === 'chairman' && $adjustedChairmanCount >= 1) {
                throw ValidationException::withMessages([
                    'panel_role' => 'This group already has a panel chairman.',
                ]);
            }

            if ($panelRole === 'member' && $adjustedMemberCount >= 2) {
                throw ValidationException::withMessages([
                    'panel_role' => 'This group already has two panel members.',
                ]);
            }

            $replaceAssignment->update([
                'panelist_id' => $panelist->id,
                'role' => $panelRole,
                'assigned_by' => $userId,
            ]);

            return back()->with('success', 'Panelist replaced successfully.');
        }

        if ($currentAssignments->count() >= 3) {
            throw ValidationException::withMessages([
                'panelist_id' => 'This group already has 3 panelists assigned.',
            ]);
        }

        if ($panelRole === 'chairman' && $chairmanCount >= 1) {
            throw ValidationException::withMessages([
                'panel_role' => 'This group already has a panel chairman.',
            ]);
        }

        if ($panelRole === 'member' && $memberCount >= 2) {
            throw ValidationException::withMessages([
                'panel_role' => 'This group already has two panel members.',
            ]);
        }

        $usedSlots = $currentAssignments->pluck('panel_slot')->all();
        $availableSlot = collect([1, 2, 3])->first(fn (int $slot): bool => ! in_array($slot, $usedSlots, true));

        if ($availableSlot === null) {
            throw ValidationException::withMessages([
                'panelist_id' => 'No available panel slots for this group.',
            ]);
        }

        GroupPanelist::query()->create([
            'group_id' => $group->id,
            'panelist_id' => $panelist->id,
            'panel_slot' => $availableSlot,
            'role' => $panelRole,
            'assigned_by' => $userId,
        ]);

        return back()->with('success', 'Panelist assigned successfully.');
    }
}
