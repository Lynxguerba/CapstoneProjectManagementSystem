<?php

namespace App\Http\Controllers;

use App\Http\Requests\EnrollStudentRequest;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class EnrollStudentController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(EnrollStudentRequest $request): RedirectResponse
    {
        $programSetId = $request->integer('program_set_id');
        $userId = $request->user()?->id;
        $studentId = $request->integer('student_id');

        $programSet = ProgramSet::query()->findOrFail($programSetId);
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }
        $student = User::query()->with('studentProgram')->findOrFail($studentId);

        if (! $student->hasRole('student')) {
            throw ValidationException::withMessages([
                'student_id' => 'The selected user is not a student.',
            ]);
        }

        $programSetProgram = is_string($programSet->program) ? trim($programSet->program) : '';
        if ($programSetProgram !== '' && Schema::hasTable('student_program')) {
            $studentProgram = is_string($student->studentProgram?->program) ? trim($student->studentProgram->program) : '';

            if ($studentProgram === '' || strcasecmp($studentProgram, $programSetProgram) !== 0) {
                throw ValidationException::withMessages([
                    'student_id' => 'The selected student does not match the program for this set.',
                ]);
            }
        }

        $alreadyEnrolled = $programSet->students()->whereKey($student->id)->exists();
        if ($alreadyEnrolled) {
            throw ValidationException::withMessages([
                'student_id' => 'This student is already enrolled in the selected program set.',
            ]);
        }

        $enrolledElsewhere = $student->programSets()->whereKeyNot($programSet->id)->exists();
        if ($enrolledElsewhere) {
            throw ValidationException::withMessages([
                'student_id' => 'This student is already enrolled in another program set.',
            ]);
        }

        $programSet->students()->attach($student->id);

        return back()->with('success', 'Student enrolled successfully.');
    }
}
