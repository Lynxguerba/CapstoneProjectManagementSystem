<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\CrossSetGroupRequest;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApproveCrossSetGroupRequestController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, CrossSetGroupRequest $crossSetRequest): RedirectResponse
    {
        $userId = $request->user()?->id;

        if (! $userId || $crossSetRequest->requested_to !== $userId) {
            abort(403);
        }

        if (! $crossSetRequest->isPending()) {
            abort(422, 'Cross-set request is no longer pending.');
        }

        DB::transaction(function () use ($crossSetRequest): void {
            $crossSetRequest->forceFill([
                'status' => 'approved',
                'responded_at' => now(),
            ])->save();

            $existingMember = GroupMember::query()
                ->where('group_id', $crossSetRequest->group_id)
                ->where('student_id', $crossSetRequest->student_id)
                ->first();

            if ($existingMember) {
                if (! $existingMember->is_cross_set) {
                    $existingMember->update([
                        'is_cross_set' => true,
                    ]);
                }
            } else {
                GroupMember::query()->create([
                    'group_id' => $crossSetRequest->group_id,
                    'student_id' => $crossSetRequest->student_id,
                    'role' => 'Programmer',
                    'is_cross_set' => true,
                ]);
            }

            Group::query()
                ->whereKey($crossSetRequest->group_id)
                ->update([
                    'is_cross_set' => true,
                ]);
        });

        return back()->with('success', 'Cross-set request approved.');
    }
}
