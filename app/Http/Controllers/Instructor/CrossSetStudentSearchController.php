<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CrossSetStudentSearchController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            abort(403);
        }

        $search = trim((string) $request->input('q', ''));
        $sourceProgramSetId = $request->filled('program_set_id') ? (int) $request->input('program_set_id') : null;
        if ($sourceProgramSetId !== null && $sourceProgramSetId <= 0) {
            $sourceProgramSetId = null;
        }

        $managedProgramSetIds = ProgramSet::query()
            ->where('instructor_id', $userId)
            ->pluck('id')
            ->all();

        if ($sourceProgramSetId !== null && ! in_array($sourceProgramSetId, $managedProgramSetIds, true)) {
            abort(403);
        }

        $hasProgramColumn = Schema::hasColumn('users', 'program');

        $studentsQuery = User::query()
            ->where(function (Builder $query): void {
                $query
                    ->where('role', 'student')
                    ->orWhereHas('roles', function (Builder $roleQuery): void {
                        $roleQuery->where('slug', 'student');
                    });
            })
            ->when($sourceProgramSetId !== null, function (Builder $query) use ($sourceProgramSetId): void {
                $query
                    ->whereDoesntHave('programSets', function (Builder $programSetQuery) use ($sourceProgramSetId): void {
                        $programSetQuery->where('program_sets.id', $sourceProgramSetId);
                    })
                    ->whereHas('programSets', function (Builder $programSetQuery) use ($sourceProgramSetId): void {
                        $programSetQuery->where('program_sets.id', '!=', $sourceProgramSetId);
                    });
            })
            ->when(
                $sourceProgramSetId === null && count($managedProgramSetIds) > 0,
                fn (Builder $query) => $query->whereDoesntHave('programSets', function (Builder $programSetQuery) use ($managedProgramSetIds): void {
                    $programSetQuery->whereIn('program_sets.id', $managedProgramSetIds);
                }),
            )
            ->with([
                'programSets' => function ($query) use ($sourceProgramSetId): void {
                    $query->select('program_sets.id', 'program_sets.name');

                    if ($sourceProgramSetId !== null) {
                        $query->where('program_sets.id', '!=', $sourceProgramSetId);
                    }
                },
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(20)
            ->select(['id', 'name', 'first_name', 'last_name', 'email']);

        if ($hasProgramColumn) {
            $studentsQuery->addSelect('program');
        }

        if ($search !== '') {
            $studentsQuery->where(function (Builder $query) use ($search, $hasProgramColumn): void {
                $likeQuery = "%{$search}%";

                $query
                    ->where('first_name', 'like', $likeQuery)
                    ->orWhere('last_name', 'like', $likeQuery)
                    ->orWhere('name', 'like', $likeQuery)
                    ->orWhere('email', 'like', $likeQuery);

                if ($hasProgramColumn) {
                    $query->orWhere('program', 'like', $likeQuery);
                }
            });
        }

        $students = $studentsQuery->get();

        return response()->json([
            'students' => $students,
        ]);
    }
}
