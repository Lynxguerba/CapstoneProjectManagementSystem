<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\UpdateStudentPasswordRequest;
use Illuminate\Http\RedirectResponse;

class UpdateStudentPasswordController extends Controller
{
    public function __invoke(UpdateStudentPasswordRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            return back()->withErrors([
                'password' => 'Unable to update password for unauthenticated user.',
            ]);
        }

        $validated = $request->validated();

        $user->forceFill([
            'password' => $validated['password'],
        ])->save();

        return back()->with('success', 'Password updated successfully.');
    }
}
