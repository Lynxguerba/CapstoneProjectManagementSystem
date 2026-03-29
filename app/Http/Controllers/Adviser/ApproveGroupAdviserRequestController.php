<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\AdviserAvailability;
use App\Models\AdviserProgramUtility;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ApproveGroupAdviserRequestController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, GroupAdviserRequest $assignmentRequest): RedirectResponse
    {
        $user = $request->user();
        $userId = $user?->id;

        if (! $userId || $assignmentRequest->adviser_id !== $userId) {
            abort(403);
        }

        if (
            $assignmentRequest->request_type !== GroupAdviserRequest::TYPE_REQUEST
            || $assignmentRequest->status !== GroupAdviserRequest::STATUS_PENDING
        ) {
            return back()->with('error', 'Assignment request is no longer pending.');
        }

        $group = $assignmentRequest->group()
            ->with(['programSet.academicYear', 'adviserAssignment'])
            ->first();

        if (! $group) {
            $assignmentRequest->forceFill([
                'status' => GroupAdviserRequest::STATUS_DISMISSED,
                'responded_by' => $userId,
                'responded_at' => now(),
            ])->save();

            return back()->with('error', 'Group is no longer available.');
        }

        $currentAssignment = $group->adviserAssignment;
        $previousAdviserId = $currentAssignment?->adviser_id;

        if ($currentAssignment?->adviser_id === $userId) {
            $assignmentRequest->forceFill([
                'status' => GroupAdviserRequest::STATUS_APPROVED,
                'responded_by' => $userId,
                'responded_at' => now(),
            ])->save();

            return back()->with('success', 'Assignment already active.');
        }

        if (Schema::hasTable('adviser_availabilities')) {
            $isAvailable = AdviserAvailability::query()
                ->where('adviser_id', $userId)
                ->value('is_available');

            if (! (bool) $isAvailable) {
                return back()->with('error', 'You are currently closed for new group requests.');
            }
        }

        $groupYear = $group->programSet?->academicYear?->label ?? $group->programSet?->school_year;
        $program = $group->programSet?->program;
        $loadQuery = GroupAdviser::query()->where('adviser_id', $userId);

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
                ->where('adviser_id', $userId)
                ->where('program', $program)
                ->first();

            if ($utility) {
                $maxLoad = $utility->max_groups;
            }
        }

        if ($currentLoad >= $maxLoad) {
            $programLabel = is_string($program) && $program !== '' ? $program : 'this program';
            $label = is_string($groupYear) && $groupYear !== '' ? $groupYear : 'this academic year';

            return back()->with('error', "You already reached {$maxLoad} {$programLabel} groups for {$label}.");
        }

        GroupAdviser::query()->updateOrCreate(
            ['group_id' => $group->id],
            [
                'adviser_id' => $userId,
                'assigned_by' => $assignmentRequest->requested_by,
            ],
        );

        $assignmentRequest->forceFill([
            'status' => GroupAdviserRequest::STATUS_APPROVED,
            'responded_by' => $userId,
            'responded_at' => now(),
        ])->save();

        GroupAdviserRequest::query()
            ->where('group_id', $group->id)
            ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
            ->where('status', GroupAdviserRequest::STATUS_PENDING)
            ->whereKeyNot($assignmentRequest->id)
            ->update([
                'status' => GroupAdviserRequest::STATUS_DISMISSED,
                'responded_by' => $userId,
                'responded_at' => now(),
            ]);

        if ($previousAdviserId && $previousAdviserId !== $userId) {
            GroupAdviserRequest::query()->create([
                'group_id' => $group->id,
                'adviser_id' => $previousAdviserId,
                'requested_by' => $assignmentRequest->requested_by,
                'request_type' => GroupAdviserRequest::TYPE_REASSIGN_NOTICE,
                'status' => GroupAdviserRequest::STATUS_PENDING,
            ]);
        }

        return back()->with('success', 'Assignment approved.');
    }
}
