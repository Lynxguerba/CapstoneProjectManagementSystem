<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGroupMembersRequest;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class UpdateGroupMembersController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateGroupMembersRequest $request, Group $group): RedirectResponse
    {
        $group->load(['programSet', 'members']);

        $userId = $request->user()?->id;
        if ($userId !== null && $group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $data = $request->validated();
        $members = collect($data['members'])
            ->map(fn (array $member): array => [
                'student_id' => (int) $member['student_id'],
                'role' => (string) $member['role'],
            ])
            ->values();

        $leaders = $members->filter(fn (array $member): bool => $member['role'] === 'Project Manager')->values();
        if ($leaders->count() !== 1) {
            throw ValidationException::withMessages([
                'members' => 'Select exactly one Project Manager to lead the group.',
            ]);
        }

        $memberIds = $members->pluck('student_id')->unique()->values();
        $existingMemberIds = $group->members()
            ->whereIn('users.id', $memberIds->all())
            ->pluck('users.id')
            ->values();

        if ($existingMemberIds->count() !== $memberIds->count()) {
            throw ValidationException::withMessages([
                'members' => 'Only existing group members can be updated.',
            ]);
        }

        $group->members()->sync(
            $members
                ->mapWithKeys(fn (array $member): array => [
                    $member['student_id'] => ['role' => $member['role']],
                ])
                ->all(),
        );

        $leaderId = (int) $leaders->first()['student_id'];
        if ($group->leader_id !== $leaderId) {
            $group->update([
                'leader_id' => $leaderId,
            ]);
        }

        $leader = $group->leader()->first();
        $leaderLastName = $leader ? trim((string) $leader->last_name) : '';
        if ($leaderLastName === '' && $leader) {
            $fallbackName = trim((string) $leader->name);
            if ($fallbackName !== '') {
                $parts = preg_split('/\\s+/', $fallbackName) ?: [];
                $leaderLastName = (string) (end($parts) ?: '');
            }
        }

        if ($leaderLastName !== '' && $group->name !== $leaderLastName) {
            $group->update([
                'name' => $leaderLastName,
            ]);
        }

        GroupMember::query()
            ->where('group_id', $group->id)
            ->whereNotIn('student_id', $memberIds->all())
            ->delete();

        return back()->with('success', 'Group updated successfully.');
    }
}
