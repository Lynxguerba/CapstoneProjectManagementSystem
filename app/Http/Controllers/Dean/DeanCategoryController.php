<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dean\StoreDeanCategoryRequest;
use App\Http\Requests\Dean\UpdateDeanCategoryRequest;
use App\Models\DocumentSubmission;
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
        $statusCountsByCategory = collect();

        if (Schema::hasTable('title_categories')) {
            $categoriesQuery = TitleCategory::query()
                ->whereIn('program', $this->deanProgramScope)
                ->orderBy('program')
                ->orderBy('name');

            if (Schema::hasTable('document_submissions')) {
                $categoriesQuery->withCount('documentSubmissions as linked_projects_count');

                $statusCountsByCategory = DocumentSubmission::query()
                    ->selectRaw("title_category_id, COALESCE(NULLIF(TRIM(status), ''), 'Submitted') as project_status, COUNT(*) as total")
                    ->whereNotNull('title_category_id')
                    ->groupBy('title_category_id', 'project_status')
                    ->get()
                    ->groupBy('title_category_id');
            }

            $categories = $categoriesQuery->get(['id', 'program', 'name', 'description']);

            $categoriesByProgram = [
                'BSIT' => $categories
                    ->where('program', 'BSIT')
                    ->values()
                    ->map(function (TitleCategory $category) use ($statusCountsByCategory): array {
                        $statusCounts = $statusCountsByCategory
                            ->get($category->id, collect())
                            ->map(
                                fn (DocumentSubmission $submissionStatus): array => [
                                    'status' => (string) $submissionStatus->project_status,
                                    'count' => (int) $submissionStatus->total,
                                ]
                            )
                            ->values()
                            ->all();

                        return [
                            'id' => $category->id,
                            'program' => $category->program,
                            'name' => $category->name,
                            'description' => $category->description,
                            'linkedProjectsCount' => (int) ($category->linked_projects_count ?? 0),
                            'projectStatusCounts' => $statusCounts,
                        ];
                    })->all(),
                'BSIS' => $categories
                    ->where('program', 'BSIS')
                    ->values()
                    ->map(function (TitleCategory $category) use ($statusCountsByCategory): array {
                        $statusCounts = $statusCountsByCategory
                            ->get($category->id, collect())
                            ->map(
                                fn (DocumentSubmission $submissionStatus): array => [
                                    'status' => (string) $submissionStatus->project_status,
                                    'count' => (int) $submissionStatus->total,
                                ]
                            )
                            ->values()
                            ->all();

                        return [
                            'id' => $category->id,
                            'program' => $category->program,
                            'name' => $category->name,
                            'description' => $category->description,
                            'linkedProjectsCount' => (int) ($category->linked_projects_count ?? 0),
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
