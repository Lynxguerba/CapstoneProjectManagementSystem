<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGroupRequest;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class StoreGroupController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(StoreGroupRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $programSet = ProgramSet::query()
            ->with('students')
            ->whereKey($data['program_set_id'])
            ->firstOrFail();

        $userId = $request->user()?->id;
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }

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
        $enrolledIds = $programSet
            ->students()
            ->whereIn('users.id', $memberIds->all())
            ->pluck('users.id')
            ->values();

        if ($enrolledIds->count() !== $memberIds->count()) {
            throw ValidationException::withMessages([
                'members' => 'All members must be enrolled in this program set.',
            ]);
        }

        $alreadyGroupedIds = GroupMember::query()
            ->whereIn('student_id', $memberIds->all())
            ->whereHas('group', fn ($query) => $query->where('program_set_id', $programSet->id))
            ->pluck('student_id')
            ->unique()
            ->values();

        if ($alreadyGroupedIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'members' => 'Some students are already assigned to another group in this program set.',
            ]);
        }

        $leaderId = (int) $leaders->first()['student_id'];
        $leader = User::query()->whereKey($leaderId)->first();
        $leaderLastName = $leader ? trim((string) $leader->last_name) : '';
        if ($leaderLastName === '' && $leader) {
            $fallbackName = trim((string) $leader->name);
            if ($fallbackName !== '') {
                $parts = preg_split('/\\s+/', $fallbackName) ?: [];
                $leaderLastName = (string) (end($parts) ?: '');
            }
        }

        $groupName = $leaderLastName !== '' ? $leaderLastName : 'Group';

        $group = Group::create([
            'program_set_id' => $programSet->id,
            'leader_id' => $leaderId,
            'name' => $groupName,
        ]);

        $group->members()->sync(
            $members
                ->mapWithKeys(fn (array $member): array => [
                    $member['student_id'] => ['role' => $member['role']],
                ])
                ->all(),
        );

        return back()->with('success', 'Group created successfully.');
    }
}
