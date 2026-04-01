<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instructor\StoreCrossSetGroupRequestRequest;
use App\Models\CrossSetGroupRequest;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreCrossSetGroupRequestController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(StoreCrossSetGroupRequestRequest $request): RedirectResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            abort(403);
        }

        $data = $request->validated();
        $group = Group::query()
            ->with('programSet')
            ->whereKey($data['group_id'])
            ->firstOrFail();

        if ($group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $student = User::query()
            ->with('programSets')
            ->whereKey($data['student_id'])
            ->firstOrFail();

        if (! $student->hasRole('student')) {
            throw ValidationException::withMessages([
                'student_id' => 'Selected user is not a student.',
            ]);
        }

        $targetProgramSet = ProgramSet::query()
            ->whereHas('students', fn ($query) => $query->where('users.id', $student->id))
            ->where('id', '!=', $group->program_set_id)
            ->orderByRaw('case when instructor_id = ? then 0 else 1 end', [$userId])
            ->orderByDesc('created_at')
            ->first();

        if (! $targetProgramSet) {
            throw ValidationException::withMessages([
                'student_id' => 'Selected student is not enrolled in another program set.',
            ]);
        }

        if (! $targetProgramSet->instructor_id) {
            throw ValidationException::withMessages([
                'student_id' => 'No managing instructor found for the selected student set.',
            ]);
        }

        $targetInstructorId = (int) $targetProgramSet->instructor_id;
        $isHandledByCurrentInstructor = $targetInstructorId === $userId;

        $isAlreadyMember = GroupMember::query()
            ->where('group_id', $group->id)
            ->where('student_id', $student->id)
            ->exists();

        if ($isAlreadyMember) {
            throw ValidationException::withMessages([
                'student_id' => 'Selected student is already part of this group.',
            ]);
        }

        $existingPendingRequest = CrossSetGroupRequest::query()
            ->where('group_id', $group->id)
            ->where('student_id', $student->id)
            ->where('status', 'pending')
            ->first();

        if ($existingPendingRequest) {
            return back()->with('success', 'Cross-set request is already pending approval.');
        }

        if ($isHandledByCurrentInstructor) {
            DB::transaction(function () use ($group, $student, $targetProgramSet, $targetInstructorId, $userId): void {
                CrossSetGroupRequest::query()->create([
                    'group_id' => $group->id,
                    'student_id' => $student->id,
                    'requested_by' => $userId,
                    'requested_to' => $targetInstructorId,
                    'from_program_set_id' => $group->program_set_id,
                    'to_program_set_id' => $targetProgramSet->id,
                    'status' => 'approved',
                    'responded_at' => now(),
                ]);

                GroupMember::query()->updateOrCreate(
                    [
                        'group_id' => $group->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'role' => 'Programmer',
                        'is_cross_set' => true,
                    ],
                );

                Group::query()
                    ->whereKey($group->id)
                    ->update([
                        'is_cross_set' => true,
                    ]);
            });

            return back()->with('success', 'Student from your other handled set added to the group.');
        }

        CrossSetGroupRequest::query()->create([
            'group_id' => $group->id,
            'student_id' => $student->id,
            'requested_by' => $userId,
            'requested_to' => $targetInstructorId,
            'from_program_set_id' => $group->program_set_id,
            'to_program_set_id' => $targetProgramSet->id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Cross-set request sent for approval.');
    }
}
