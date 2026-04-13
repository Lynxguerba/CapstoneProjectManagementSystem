<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dean\UpdateDeanProjectCategoryRequest;
use App\Models\Group;
use App\Models\TitleCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpdateDeanProjectCategoryController extends Controller
{
    public function __invoke(UpdateDeanProjectCategoryRequest $request, int $group): RedirectResponse
    {
        $deanProgramScope = ['BSIT', 'BSIS'];

        if (! Schema::hasTable('groups') || ! Schema::hasTable('program_sets')) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Groups and program sets are unavailable.',
            ]);
        }

        if (! Schema::hasTable('document_submissions') || ! Schema::hasColumn('document_submissions', 'title_category_id')) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Concept categories are not available yet. Please run the latest migrations first.',
            ]);
        }

        $groupModel = Group::query()
            ->with(['programSet:id,program', 'approvedConceptSubmission:id'])
            ->whereKey($group)
            ->whereHas('programSet', fn (Builder $query): Builder => $query->whereIn('program', $deanProgramScope))
            ->first();

        if (! $groupModel instanceof Group || $groupModel->approvedConceptSubmission === null) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Approved concept title was not found for this group.',
            ]);
        }

        $groupProgram = $groupModel->programSet?->program;
        if (! in_array($groupProgram, $deanProgramScope, true)) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Group program is outside the Dean category scope.',
            ]);
        }

        $validatedCategoryId = $request->validated('title_category_id');
        if ($validatedCategoryId === null || $validatedCategoryId === '') {
            $submission = $groupModel->approvedConceptSubmission;
            $submission->title_category_id = null;
            $submission->save();

            return back()->with('success', 'Project category cleared successfully.');
        }

        $categoryId = (int) $validatedCategoryId;
        $category = TitleCategory::query()
            ->whereKey($categoryId)
            ->where('program', $groupProgram)
            ->first();

        if (! $category instanceof TitleCategory) {
            throw ValidationException::withMessages([
                'title_category_id' => "Selected category does not belong to {$groupProgram}.",
            ]);
        }

        $submission = $groupModel->approvedConceptSubmission;
        $submission->title_category_id = $category->id;
        $submission->save();

        return back()->with('success', 'Project category updated successfully.');
    }
}
