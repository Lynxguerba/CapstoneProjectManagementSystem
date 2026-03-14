<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProgramSetNameRequest;
use App\Models\ProgramSet;
use Illuminate\Http\RedirectResponse;

class UpdateProgramSetNameController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateProgramSetNameRequest $request, ProgramSet $programSet): RedirectResponse
    {
        $userId = $request->user()?->id;
        if ($userId !== null && $programSet->instructor_id !== $userId) {
            abort(403);
        }

        $programSet->update([
            'name' => $request->string('name')->trim()->toString(),
        ]);

        return back()->with('success', 'Program set name updated successfully.');
    }
}
