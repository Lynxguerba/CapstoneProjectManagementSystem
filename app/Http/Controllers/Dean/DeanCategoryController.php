<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dean\StoreDeanCategoryRequest;
use App\Http\Requests\Dean\UpdateDeanCategoryRequest;
use App\Models\Group;
use App\Models\TitleCategory;
use App\Models\TitleRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DeanCategoryController extends Controller
{
    /**
     * @var array<int, string>
     */
    private array $deanProgramScope = ['BSIT', 'BSIS'];

    public function index(): Response
    {
        $categoriesByProgram = [
            'BSIT' => [],
            'BSIS' => [],
        ];
        $linkedProjectCountsByCategory = collect();
        $statusCountsByCategory = collect();

        if (Schema::hasTable('title_categories')) {
            if (
                Schema::hasTable('groups')
                && Schema::hasTable('program_sets')
                && Schema::hasTable('document_submissions')
            ) {
                $approvedProjectStatusRows = Group::query()
                    ->selectRaw("document_submissions.title_category_id, COALESCE(NULLIF(TRIM(document_submissions.status), ''), 'Submitted') as project_status, COUNT(DISTINCT groups.id) as total")
                    ->join('program_sets', 'program_sets.id', '=', 'groups.program_set_id')
                    ->join('document_submissions', 'document_submissions.id', '=', 'groups.approved_concept_submission_id')
                    ->whereIn('program_sets.program', $this->deanProgramScope)
                    ->whereNotNull('groups.approved_concept_submission_id')
                    ->whereNotNull('document_submissions.title_category_id')
                    ->groupBy('document_submissions.title_category_id', 'project_status')
                    ->get();

                $statusCountsByCategory = $approvedProjectStatusRows->groupBy('title_category_id');
                $linkedProjectCountsByCategory = $approvedProjectStatusRows
                    ->groupBy('title_category_id')
                    ->map(static fn ($rows): int => (int) $rows->sum('total'));
            } elseif (Schema::hasTable('title_repositories')) {
                $linkedProjectCountsByCategory = TitleCategory::query()
                    ->whereIn('program', $this->deanProgramScope)
                    ->withCount('titleRepositories as linked_projects_count')
                    ->get(['id'])
                    ->pluck('linked_projects_count', 'id');
            }

            $categories = TitleCategory::query()
                ->whereIn('program', $this->deanProgramScope)
                ->orderBy('program')
                ->orderBy('name')
                ->get(['id', 'program', 'name', 'description']);

            $categoriesByProgram = [
                'BSIT' => $categories
                    ->where('program', 'BSIT')
                    ->values()
                    ->map(function (TitleCategory $category) use ($linkedProjectCountsByCategory, $statusCountsByCategory): array {
                        $statusCounts = $statusCountsByCategory
                            ->get($category->id, collect())
                            ->map(
                                static fn ($statusRow): array => [
                                    'status' => (string) ($statusRow->project_status ?? 'Submitted'),
                                    'count' => (int) ($statusRow->total ?? 0),
                                ]
                            )
                            ->values()
                            ->all();

                        return [
                            'id' => $category->id,
                            'program' => $category->program,
                            'name' => $category->name,
                            'description' => $category->description,
                            'linkedProjectsCount' => (int) ($linkedProjectCountsByCategory->get($category->id, 0)),
                            'projectStatusCounts' => $statusCounts,
                        ];
                    })->all(),
                'BSIS' => $categories
                    ->where('program', 'BSIS')
                    ->values()
                    ->map(function (TitleCategory $category) use ($linkedProjectCountsByCategory, $statusCountsByCategory): array {
                        $statusCounts = $statusCountsByCategory
                            ->get($category->id, collect())
                            ->map(
                                static fn ($statusRow): array => [
                                    'status' => (string) ($statusRow->project_status ?? 'Submitted'),
                                    'count' => (int) ($statusRow->total ?? 0),
                                ]
                            )
                            ->values()
                            ->all();

                        return [
                            'id' => $category->id,
                            'program' => $category->program,
                            'name' => $category->name,
                            'description' => $category->description,
                            'linkedProjectsCount' => (int) ($linkedProjectCountsByCategory->get($category->id, 0)),
                            'projectStatusCounts' => $statusCounts,
                        ];
                    })->all(),
            ];
        }

        return Inertia::render('Dean/categories', [
            'categoriesByProgram' => $categoriesByProgram,
        ]);
    }

    public function store(StoreDeanCategoryRequest $request): RedirectResponse
    {
        if (! Schema::hasTable('title_categories')) {
            throw ValidationException::withMessages([
                'name' => 'Categories table is unavailable. Please run the latest migrations first.',
            ]);
        }

        $validated = $request->validated();

        TitleCategory::query()->create([
            'program' => $validated['program'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Category created successfully.');
    }

    public function update(UpdateDeanCategoryRequest $request, TitleCategory $category): RedirectResponse
    {
        if (! in_array($category->program, $this->deanProgramScope, true)) {
            abort(404);
        }

        $validated = $request->validated();

        $category->name = $validated['name'];
        $category->description = $validated['description'] ?? null;
        $category->save();

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroy(TitleCategory $category): RedirectResponse
    {
        if (! in_array($category->program, $this->deanProgramScope, true)) {
            abort(404);
        }

        $hasReferencedTitles = Schema::hasTable('title_repositories')
            && TitleRepository::query()->where('title_category_id', $category->id)->exists();

        if ($hasReferencedTitles) {
            throw ValidationException::withMessages([
                'category' => 'Cannot delete category because it is used by title repository records.',
            ]);
        }

        $hasReferencedSubmissions = Schema::hasTable('document_submissions')
            && TitleCategory::query()
                ->whereKey($category->id)
                ->whereHas('documentSubmissions')
                ->exists();

        if ($hasReferencedSubmissions) {
            throw ValidationException::withMessages([
                'category' => 'Cannot delete category because it is used by concept submissions.',
            ]);
        }

        $category->delete();

        return back()->with('success', 'Category deleted successfully.');
    }
}
