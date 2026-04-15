<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePasswordRequest;
use Illuminate\Http\RedirectResponse;

class UpdatePasswordController extends Controller
{
    public function __invoke(UpdatePasswordRequest $request): RedirectResponse
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
