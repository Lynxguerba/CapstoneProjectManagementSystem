<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkEnrollStudentsRequest;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class BulkEnrollStudentsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(BulkEnrollStudentsRequest $request): RedirectResponse
    {
        $programSetId = $request->integer('program_set_id');
        $programSet = ProgramSet::query()->findOrFail($programSetId);

        $studentIds = collect($request->input('rows', []))
            ->pluck('student_id')
            ->filter()
            ->unique()
            ->values();

        if ($studentIds->isEmpty()) {
            throw ValidationException::withMessages([
                'rows' => 'Please select at least one student to enroll.',
            ]);
        }

        $students = User::query()
            ->with('studentProgram')
            ->whereIn('id', $studentIds->all())
            ->get();

        $foundIds = $students->pluck('id')->all();
        $missingIds = $studentIds->diff($foundIds);

        if ($missingIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'rows' => 'One or more selected students could not be found.',
            ]);
        }

        $nonStudents = $students->filter(fn (User $student): bool => ! $student->hasRole('student'));
        if ($nonStudents->isNotEmpty()) {
            throw ValidationException::withMessages([
                'rows' => 'One or more selected users are not students.',
            ]);
        }

        $alreadyEnrolledElsewhere = User::query()
            ->whereIn('id', $studentIds->all())
            ->whereHas('programSets', function (Builder $query) use ($programSet): void {
                $query->where('program_sets.id', '!=', $programSet->id);
            })
            ->exists();

        if ($alreadyEnrolledElsewhere) {
            throw ValidationException::withMessages([
                'rows' => 'One or more selected students are already enrolled in another program set.',
            ]);
        }

        $programSetProgram = is_string($programSet->program) ? trim($programSet->program) : '';
        if ($programSetProgram !== '' && Schema::hasTable('student_program')) {
            $mismatched = $students->filter(function (User $student) use ($programSetProgram): bool {
                $studentProgram = is_string($student->studentProgram?->program) ? trim($student->studentProgram->program) : '';

                return $studentProgram === '' || strcasecmp($studentProgram, $programSetProgram) !== 0;
            });

            if ($mismatched->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'rows' => 'Some selected students do not match the program for this set.',
                ]);
            }
        }

        $programSet->students()->syncWithoutDetaching($studentIds->all());

        return back()->with('success', 'Students enrolled successfully.');
    }
}
