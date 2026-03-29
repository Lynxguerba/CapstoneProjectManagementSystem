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
            ->pluck('users.id')
            ->unique()
            ->values();
        $newMemberIds = $memberIds->diff($existingMemberIds)->values();

        if ($newMemberIds->isNotEmpty()) {
            $enrolledNewMemberIds = $group->programSet
                ? $group->programSet
                    ->students()
                    ->whereIn('users.id', $newMemberIds->all())
                    ->pluck('users.id')
                    ->unique()
                    ->values()
                : collect();

            if ($enrolledNewMemberIds->count() !== $newMemberIds->count()) {
                throw ValidationException::withMessages([
                    'members' => 'Only students enrolled in this program set can be added.',
                ]);
            }
        }

        $alreadyGroupedInSetIds = GroupMember::query()
            ->whereIn('student_id', $memberIds->all())
            ->where('group_id', '!=', $group->id)
            ->whereHas('group', fn ($query) => $query->where('program_set_id', $group->program_set_id))
            ->pluck('student_id')
            ->unique()
            ->values();

        if ($alreadyGroupedInSetIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'members' => 'Some students are already assigned to another group in this program set.',
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
