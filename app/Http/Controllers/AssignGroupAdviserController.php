<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignGroupAdviserRequest;
use App\Models\AdviserAvailability;
use App\Models\AdviserProgramUtility;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AssignGroupAdviserController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(AssignGroupAdviserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $group = Group::query()
            ->with(['programSet.academicYear', 'adviserAssignment'])
            ->whereKey($data['group_id'])
            ->firstOrFail();

        $userId = $request->user()?->id;
        if ($userId !== null && $group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $adviser = User::query()->whereKey($data['adviser_id'])->firstOrFail();
        if (! $adviser->hasRole('adviser')) {
            throw ValidationException::withMessages([
                'adviser_id' => 'Selected user is not an adviser.',
            ]);
        }

        $currentAssignment = $group->adviserAssignment;
        $isAlreadyAssigned = $currentAssignment?->adviser_id === $adviser->id;

        if ($isAlreadyAssigned) {
            return back()->with('success', 'Adviser already assigned.');
        }

        if (Schema::hasTable('adviser_availabilities')) {
            $isAvailable = AdviserAvailability::query()
                ->where('adviser_id', $adviser->id)
                ->value('is_available');

            if (! (bool) $isAvailable) {
                throw ValidationException::withMessages([
                    'adviser_id' => 'Selected adviser is currently closed for new group requests.',
                ]);
            }
        }

        $groupYear = $group->programSet?->academicYear?->label ?? $group->programSet?->school_year;
        $program = $group->programSet?->program;
        $loadQuery = GroupAdviser::query()->where('adviser_id', $adviser->id);

        $loadQuery->whereHas('group.programSet', function ($query) use ($groupYear, $program) {
            if (is_string($program) && $program !== '') {
                $query->where('program', $program);
            }

            if (is_string($groupYear) && $groupYear !== '') {
                $query->where(function ($subQuery) use ($groupYear) {
                    $subQuery->whereHas('academicYear', fn ($academicQuery) => $academicQuery->where('label', $groupYear));

                    if (Schema::hasColumn('program_sets', 'school_year')) {
                        $subQuery->orWhere('school_year', $groupYear);
                    }
                });
            }
        });

        $currentLoad = $loadQuery->count();
        $maxLoad = 5;

        if (Schema::hasTable('adviser_program_utilities') && is_string($program) && $program !== '') {
            $utility = AdviserProgramUtility::query()
                ->where('adviser_id', $adviser->id)
                ->where('program', $program)
                ->first();

            if ($utility) {
                $maxLoad = $utility->max_groups;
            }
        }

        if ($currentLoad >= $maxLoad) {
            $programLabel = is_string($program) && $program !== '' ? $program : 'this program';
            $label = is_string($groupYear) && $groupYear !== '' ? $groupYear : 'this academic year';

            throw ValidationException::withMessages([
                'adviser_id' => "Selected adviser already reached {$maxLoad} {$programLabel} groups for {$label}.",
            ]);
        }

        $hasRequestTable = Schema::hasTable('group_adviser_requests');
        $isReassign = $currentAssignment !== null && $currentAssignment->adviser_id !== $adviser->id;

        if ($hasRequestTable) {
            GroupAdviserRequest::query()
                ->where('group_id', $group->id)
                ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
                ->where('status', GroupAdviserRequest::STATUS_PENDING)
                ->update([
                    'status' => GroupAdviserRequest::STATUS_REJECTED,
                    'responded_by' => $userId,
                    'responded_at' => now(),
                ]);

            GroupAdviserRequest::query()->updateOrCreate(
                [
                    'group_id' => $group->id,
                    'adviser_id' => $adviser->id,
                    'request_type' => GroupAdviserRequest::TYPE_REQUEST,
                    'status' => GroupAdviserRequest::STATUS_PENDING,
                ],
                [
                    'requested_by' => $userId,
                ],
            );

            $message = $isReassign
                ? 'Reassignment request sent for adviser approval.'
                : 'Assignment request sent for adviser approval.';

            return back()->with('success', $message);
        }

        GroupAdviser::query()->updateOrCreate(
            ['group_id' => $group->id],
            [
                'adviser_id' => $adviser->id,
                'assigned_by' => $userId,
            ],
        );

        if ($hasRequestTable && $currentAssignment?->adviser_id) {
            GroupAdviserRequest::query()->create([
                'group_id' => $group->id,
                'adviser_id' => $currentAssignment->adviser_id,
                'requested_by' => $userId,
                'request_type' => GroupAdviserRequest::TYPE_REASSIGN_NOTICE,
                'status' => GroupAdviserRequest::STATUS_PENDING,
            ]);
        }

        return back()->with('success', $isReassign ? 'Adviser reassigned successfully.' : 'Adviser assigned successfully.');
    }
}
