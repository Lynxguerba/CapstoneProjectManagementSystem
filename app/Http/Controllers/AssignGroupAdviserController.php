<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignGroupAdviserRequest;
use App\Models\Group;
use App\Models\GroupAdviser;
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

        if (! $isAlreadyAssigned) {
            $groupYear = $group->programSet?->academicYear?->label ?? $group->programSet?->school_year;
            $loadQuery = GroupAdviser::query()->where('adviser_id', $adviser->id);

            if (is_string($groupYear) && $groupYear !== '') {
                $loadQuery->whereHas('group.programSet', function ($query) use ($groupYear) {
                    $query->where(function ($subQuery) use ($groupYear) {
                        $subQuery->whereHas('academicYear', fn ($academicQuery) => $academicQuery->where('label', $groupYear));

                        if (Schema::hasColumn('program_sets', 'school_year')) {
                            $subQuery->orWhere('school_year', $groupYear);
                        }
                    });
                });
            }

            $currentLoad = $loadQuery->count();
            $maxLoad = 5;

            if ($currentLoad >= $maxLoad) {
                $label = is_string($groupYear) && $groupYear !== '' ? $groupYear : 'this academic year';

                throw ValidationException::withMessages([
                    'adviser_id' => "Selected adviser already reached {$maxLoad} groups for {$label}.",
                ]);
            }
        }

        GroupAdviser::query()->updateOrCreate(
            ['group_id' => $group->id],
            [
                'adviser_id' => $adviser->id,
                'assigned_by' => $userId,
            ],
        );

        return back()->with('success', 'Adviser assigned successfully.');
    }
}
