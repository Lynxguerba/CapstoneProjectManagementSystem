<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreAdviserRequest;
use App\Models\AdviserAvailability;
use App\Models\AdviserProgramUtility;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AdviserRequestController extends Controller
{
    public function __invoke(StoreAdviserRequest $request): RedirectResponse
    {
        $userId = Auth::guard('web')->id();

        if ($userId === null) {
            abort(403);
        }

        $group = $this->resolveStudentGroup($userId);

        if (! $group) {
            return back()->with('error', 'You are not assigned to a group yet.');
        }

        if (! Schema::hasTable('group_adviser_requests')) {
            return back()->with('error', 'Adviser requests are not available yet.');
        }

        $adviserId = (int) $request->validated('adviser_id');
        $adviser = User::query()->whereKey($adviserId)->firstOrFail();

        if (! $adviser->hasRole('adviser')) {
            throw ValidationException::withMessages([
                'adviser_id' => 'Selected user is not an adviser.',
            ]);
        }

        $currentAssignment = $group->adviserAssignment;

        if ($currentAssignment?->adviser_id === $adviser->id) {
            return back()->with('success', 'Adviser already assigned.');
        }
        $hasCurrentAdviser = $currentAssignment?->adviser_id !== null;

        $pendingExists = GroupAdviserRequest::query()
            ->where('group_id', $group->id)
            ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
            ->where('status', GroupAdviserRequest::STATUS_PENDING)
            ->exists();

        if ($pendingExists) {
            return back()->with('error', 'There is already a pending adviser request for your group.');
        }

        if (Schema::hasTable('adviser_availabilities')) {
            $isAvailable = AdviserAvailability::query()
                ->where('adviser_id', $adviser->id)
                ->value('is_available');

            if ($isAvailable === false || $isAvailable === 0) {
                throw ValidationException::withMessages([
                    'adviser_id' => 'Selected adviser is currently closed for new group requests.',
                ]);
            }
        }

        $groupYear = $group->programSet?->academicYear?->label ?? $group->programSet?->school_year;
        $program = $group->programSet?->program;
        $loadQuery = GroupAdviser::query()->where('adviser_id', $adviser->id);

        $loadQuery->whereHas('group.programSet', function ($query) use ($groupYear, $program): void {
            if (is_string($program) && $program !== '') {
                $query->where('program', $program);
            }

            if (is_string($groupYear) && $groupYear !== '') {
                $query->where(function ($subQuery) use ($groupYear): void {
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

        GroupAdviserRequest::query()->create([
            'group_id' => $group->id,
            'adviser_id' => $adviser->id,
            'requested_by' => $userId,
            'request_type' => GroupAdviserRequest::TYPE_REQUEST,
            'status' => GroupAdviserRequest::STATUS_PENDING,
        ]);

        return back()->with(
            'success',
            $hasCurrentAdviser ? 'Reassignment request sent for approval.' : 'Adviser invitation sent for approval.',
        );
    }

    private function resolveStudentGroup(int $studentId): ?Group
    {
        if (! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');
        $hasProgramSetsTable = Schema::hasTable('program_sets');
        $hasAcademicYearsTable = Schema::hasTable('academic_years');

        $query = Group::query();

        if ($hasProgramSetsTable) {
            $query->with('programSet');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear');
            }
        }

        if (Schema::hasTable('group_advisers')) {
            $query->with('adviserAssignment');
        }

        $query->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
            $groupQuery->where('leader_id', $studentId);

            if ($hasGroupMembersTable) {
                $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                    $memberQuery->where('users.id', $studentId);
                });
            }
        });

        return $query->first();
    }
}
