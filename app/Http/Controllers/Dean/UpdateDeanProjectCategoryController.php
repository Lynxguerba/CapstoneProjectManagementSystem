<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dean\UpdateDeanProjectCategoryRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\TitleCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpdateDeanProjectCategoryController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateDeanProjectCategoryRequest $request, Group $group): RedirectResponse
    {
        $deanProgramScope = ['BSIT', 'BSIS'];

        $group->loadMissing([
            'programSet:id,program',
            'approvedConceptSubmission:id,group_id,title_category_id',
        ]);

        $groupProgram = is_string($group->programSet?->program) ? trim($group->programSet->program) : null;

        if ($groupProgram === null || ! in_array($groupProgram, $deanProgramScope, true)) {
            abort(404);
        }

        if (! $group->approvedConceptSubmission instanceof DocumentSubmission) {
            abort(404);
        }

        if (! Schema::hasTable('document_submissions') || ! Schema::hasColumn('document_submissions', 'title_category_id')) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Project categories are not available yet. Please run the latest migrations first.',
            ]);
        }

        if (! Schema::hasTable('title_categories')) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Categories table is unavailable. Please run the latest migrations first.',
            ]);
        }

        $validated = $request->validated();
        $titleCategoryId = $validated['title_category_id'] ?? null;

        if ($titleCategoryId !== null) {
            $category = TitleCategory::query()
                ->whereKey($titleCategoryId)
                ->first(['id', 'program']);

            if (! $category instanceof TitleCategory || $category->program !== $groupProgram) {
                throw ValidationException::withMessages([
                    'title_category_id' => 'Selected category does not belong to this group program.',
                ]);
            }
        }

        $group->approvedConceptSubmission->title_category_id = $titleCategoryId;
        $group->approvedConceptSubmission->save();

        return back()->with('success', 'Project category updated successfully.');
    }
}
