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
        $hasStudentIdNumberColumn = Schema::hasColumn('users', 'student_id_number');
        $searchTerms = collect(preg_split('/\s+/', $search) ?: [])
            ->map(fn ($term): string => trim((string) $term))
            ->filter(fn (string $term): bool => $term !== '')
            ->values();

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
                    $query->select('program_sets.id', 'program_sets.name', 'program_sets.instructor_id');

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

        if ($hasStudentIdNumberColumn) {
            $studentsQuery->addSelect('student_id_number');
        }

        if ($search !== '') {
            $studentsQuery->where(function (Builder $query) use ($search, $searchTerms, $hasProgramColumn, $hasStudentIdNumberColumn): void {
                $likeQuery = "%{$search}%";

                $query
                    ->where('first_name', 'like', $likeQuery)
                    ->orWhere('last_name', 'like', $likeQuery)
                    ->orWhere('name', 'like', $likeQuery)
                    ->orWhere('email', 'like', $likeQuery);

                if ($hasProgramColumn) {
                    $query->orWhere('program', 'like', $likeQuery);
                }

                if ($hasStudentIdNumberColumn) {
                    $query->orWhere('student_id_number', 'like', $likeQuery);
                }

                if ($searchTerms->count() > 1) {
                    $query->orWhere(function (Builder $nameQuery) use ($searchTerms): void {
                        foreach ($searchTerms as $term) {
                            $termLike = "%{$term}%";
                            $nameQuery->where(function (Builder $segmentQuery) use ($termLike): void {
                                $segmentQuery
                                    ->where('first_name', 'like', $termLike)
                                    ->orWhere('last_name', 'like', $termLike)
                                    ->orWhere('name', 'like', $termLike);
                            });
                        }
                    });
                }
            });
        }

        $students = $studentsQuery->get()
            ->map(function (User $student) use ($userId): array {
                $programSets = $student->programSets
                    ->map(fn (ProgramSet $programSet): array => [
                        'id' => $programSet->id,
                        'name' => $programSet->name,
                    ])
                    ->values()
                    ->all();

                $isSelfManaged = $student->programSets->contains(
                    fn (ProgramSet $programSet): bool => (int) $programSet->instructor_id === (int) $userId,
                );

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'email' => $student->email,
                    'program' => $student->program ?? null,
                    'student_id_number' => $student->student_id_number ?? null,
                    'programSets' => $programSets,
                    'is_self_managed' => $isSelfManaged,
                ];
            })
            ->values();

        return response()->json([
            'students' => $students,
        ]);
    }
}
