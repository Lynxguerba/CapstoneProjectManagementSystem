<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\Dean\DeanCategoryController;
use App\Http\Controllers\Dean\DeanDashboardController;
use App\Http\Controllers\Dean\ShowDeanProjectDetailsController;
use App\Http\Controllers\Dean\UpdateDeanProjectCategoryController;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:dean'])->prefix('dean')->group(function () {
    Route::get('/dashboard', DeanDashboardController::class)->name('dean.dashboard');
    Route::get('/projects', function () {
        $deanProgramScope = ['BSIT', 'BSIS'];
        $projects = [];
        $programSetOptions = [];
        $instructorOptions = [];
        $adviserOptions = [];

        try {
            if (class_exists(Group::class) && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
                $resolveUserName = static function (?User $faculty): string {
                    if (! $faculty) {
                        return '';
                    }

                    $firstName = is_string($faculty->first_name) ? trim($faculty->first_name) : '';
                    $lastName = is_string($faculty->last_name) ? trim($faculty->last_name) : '';
                    $fullName = $firstName !== '' || $lastName !== ''
                        ? trim($firstName.' '.$lastName)
                        : (is_string($faculty->name) ? trim($faculty->name) : '');

                    return $fullName;
                };

                $hasGroupAdvisersTable = Schema::hasTable('group_advisers');
                $groupsQuery = Group::query()
                    ->with([
                        'leader:id,name,first_name,last_name',
                        'programSet:id,name,program,instructor_id',
                        'programSet.instructor:id,name,first_name,last_name',
                        'approvedConceptSubmission:id,file_name,created_at',
                    ])
                    ->whereHas('programSet', fn (Builder $query): Builder => $query->whereIn('program', $deanProgramScope))
                    ->whereNotNull('approved_concept_submission_id')
                    ->whereHas('approvedConceptSubmission')
                    ->withCount('members')
                    ->orderByDesc('concept_verdict_decided_at')
                    ->orderByDesc('updated_at');

                if ($hasGroupAdvisersTable) {
                    $groupsQuery->with(['adviserAssignment.adviser:id,name,first_name,last_name']);
                }

                $projects = $groupsQuery
                    ->get()
                    ->map(function (Group $group) use ($resolveUserName, $hasGroupAdvisersTable): array {
                        $adviserName = $hasGroupAdvisersTable
                            ? $resolveUserName($group->adviserAssignment?->adviser)
                            : '';
                        $instructorName = $resolveUserName($group->programSet?->instructor);
                        $approvedConceptTitle = $group->approvedConceptSubmission?->file_name;
                        $approvedAt = $group->concept_verdict_decided_at?->format('Y-m-d H:i')
                            ?? $group->approvedConceptSubmission?->created_at?->format('Y-m-d H:i');

                        return [
                            'id' => $group->id,
                            'group_name' => $group->name,
                            'title' => is_string($approvedConceptTitle) ? $approvedConceptTitle : 'Untitled Concept',
                            'program_set_id' => $group->programSet?->id,
                            'program_set_name' => $group->programSet?->name,
                            'program' => $group->programSet?->program,
                            'adviser_name' => $adviserName,
                            'instructor_name' => $instructorName,
                            'leader_name' => $resolveUserName($group->leader),
                            'members_count' => (int) ($group->members_count ?? 0),
                            'approved_at' => $approvedAt,
                        ];
                    })
                    ->values()
                    ->all();

                $programSetOptions = collect($projects)
                    ->filter(fn (array $project): bool => isset($project['program_set_id']) && is_int($project['program_set_id']))
                    ->map(fn (array $project): array => [
                        'id' => $project['program_set_id'],
                        'name' => is_string($project['program_set_name']) ? $project['program_set_name'] : 'Unnamed Set',
                    ])
                    ->unique('id')
                    ->sortBy('name')
                    ->values()
                    ->all();

                $instructorOptions = collect($projects)
                    ->pluck('instructor_name')
                    ->filter(fn ($name): bool => is_string($name) && trim($name) !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                $adviserOptions = collect($projects)
                    ->pluck('adviser_name')
                    ->filter(fn ($name): bool => is_string($name) && trim($name) !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $projects = [];
            $programSetOptions = [];
            $instructorOptions = [];
            $adviserOptions = [];
        }

        return Inertia::render('Dean/projects', [
            'projects' => $projects,
            'programSetOptions' => $programSetOptions,
            'instructorOptions' => $instructorOptions,
            'adviserOptions' => $adviserOptions,
        ]);
    })->name('dean.projects');
    Route::get('/project-details', ShowDeanProjectDetailsController::class)->name('dean.projects.details');
    Route::put('/project-details/{group}/category', UpdateDeanProjectCategoryController::class)
        ->whereNumber('group')
        ->name('dean.projects.details.category.update');
    Route::get('/categories', [DeanCategoryController::class, 'index'])->name('dean.categories');
    Route::post('/categories', [DeanCategoryController::class, 'store'])->name('dean.categories.store');
    Route::put('/categories/{category}', [DeanCategoryController::class, 'update'])
        ->whereNumber('category')
        ->name('dean.categories.update');
    Route::delete('/categories/{category}', [DeanCategoryController::class, 'destroy'])
        ->whereNumber('category')
        ->name('dean.categories.destroy');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Dean/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('dean.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('dean.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('dean.settings.e-signature.delete');
});
