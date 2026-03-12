<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProgramSetRequest;
use App\Models\ProgramSet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class StoreProgramSetController extends Controller
{
    public function __invoke(StoreProgramSetRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $programSet = ProgramSet::create([
            'name' => $data['name'],
            'program' => $data['program'],
            'academic_year_id' => $data['academic_year_id'],
            'instructor_id' => $user->id,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Program set created.');
    }
}
