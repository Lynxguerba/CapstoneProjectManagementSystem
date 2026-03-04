<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\UpdateAdviserPasswordRequest;
use Illuminate\Http\RedirectResponse;

class UpdateAdviserPasswordController extends Controller
{
    public function __invoke(UpdateAdviserPasswordRequest $request): RedirectResponse
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
