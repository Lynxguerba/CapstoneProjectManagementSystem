<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dean\UpdateDeanProjectTitleRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpdateDeanProjectTitleController extends Controller
{
    public function __invoke(UpdateDeanProjectTitleRequest $request, Group $group): RedirectResponse
    {
        $deanProgramScope = ['BSIT', 'BSIS'];

        $group->loadMissing([
            'programSet:id,program',
            'approvedConceptSubmission:id,group_id,file_name',
        ]);

        $groupProgram = is_string($group->programSet?->program) ? trim($group->programSet->program) : null;

        if ($groupProgram === null || ! in_array($groupProgram, $deanProgramScope, true)) {
            abort(404);
        }

        if (! $group->approvedConceptSubmission instanceof DocumentSubmission) {
            abort(404);
        }

        if (! Schema::hasTable('document_submissions') || ! Schema::hasColumn('document_submissions', 'file_name')) {
            throw ValidationException::withMessages([
                'title' => 'Project titles are not available yet. Please run the latest migrations first.',
            ]);
        }

        $title = trim((string) $request->validated('title'));

        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => 'Enter a project title.',
            ]);
        }

        $group->approvedConceptSubmission->file_name = $title;
        $group->approvedConceptSubmission->save();

        return back()->with('success', 'Project title renamed successfully.');
    }
}
