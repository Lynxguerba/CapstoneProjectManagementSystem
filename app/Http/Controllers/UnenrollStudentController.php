<?php

namespace App\Http\Controllers;

use App\Http\Requests\UnenrollStudentRequest;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class UnenrollStudentController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UnenrollStudentRequest $request): RedirectResponse
    {
        $programSetId = $request->integer('program_set_id');
        $userId = $request->user()?->id;
        $studentId = $request->integer('student_id');

        $programSet = ProgramSet::query()->findOrFail($programSetId);
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }
        $student = User::query()->findOrFail($studentId);

        if (! $student->hasRole('student')) {
            throw ValidationException::withMessages([
                'student_id' => 'The selected user is not a student.',
            ]);
        }

        $enrolled = $programSet->students()->whereKey($student->id)->exists();
        if (! $enrolled) {
            throw ValidationException::withMessages([
                'student_id' => 'This student is not enrolled in the selected program set.',
            ]);
        }

        $programSet->students()->detach($student->id);

        return back()->with('success', 'Student unenrolled successfully.');
    }
}
