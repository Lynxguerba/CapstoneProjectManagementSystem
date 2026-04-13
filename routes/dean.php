<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\Dean\UpdateDeanProjectCategoryController;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\StudentProgram;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:dean'])->prefix('dean')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dean/dashboard');
    })->name('dean.dashboard');
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
    Route::get('/project-details', function (Request $request) {
        $deanProgramScope = ['BSIT', 'BSIS'];
        $groupId = is_numeric($request->query('group')) ? (int) $request->query('group') : null;
        $groupPayload = null;
        $approvedConcept = null;
        $categoryOptions = [];
        $canSetCategory = false;

        try {
            if (
                $groupId !== null
                && class_exists(Group::class)
                && Schema::hasTable('groups')
                && Schema::hasTable('program_sets')
            ) {
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
                $groupModel = Group::query()
                    ->with([
                        'leader:id,name,first_name,last_name',
                        'members:id,name,first_name,last_name',
                        'programSet.academicYear:id,label',
                        'programSet.instructor:id,name,first_name,last_name',
                        'approvedConceptSubmission:id,group_id,file_name,file_path,status,adviser_status,title_category_id,created_at,document_requirement_id',
                        'approvedConceptSubmission.requirement:id,requirement_type',
                        'approvedConceptSubmission.titleCategory:id,name,program',
                    ])
                    ->withCount('members')
                    ->when(
                        $hasGroupAdvisersTable,
                        fn (Builder $query): Builder => $query->with('adviserAssignment.adviser:id,name,first_name,last_name')
                    )
                    ->whereKey($groupId)
                    ->whereHas('programSet', fn (Builder $query): Builder => $query->whereIn('program', $deanProgramScope))
                    ->first();

                if ($groupModel instanceof Group) {
                    $resolvedProgram = in_array($groupModel->programSet?->program, $deanProgramScope, true)
                        ? (string) $groupModel->programSet?->program
                        : null;

                    if (
                        $resolvedProgram === null
                        && Schema::hasTable('student_program')
                        && (
                            Schema::hasTable('group_members')
                            || Schema::hasColumn('groups', 'leader_id')
                        )
                    ) {
                        $studentIds = collect([$groupModel->leader_id])
                            ->merge(
                                Schema::hasTable('group_members')
                                    ? $groupModel->members()->pluck('users.id')
                                    : collect()
                            )
                            ->filter(fn ($id): bool => is_numeric($id))
                            ->map(fn ($id): int => (int) $id)
                            ->unique()
                            ->values();

                        if ($studentIds->isNotEmpty()) {
                            $memberProgram = StudentProgram::query()
                                ->whereIn('student_id', $studentIds->all())
                                ->whereIn('program', $deanProgramScope)
                                ->value('program');

                            if (is_string($memberProgram)) {
                                $resolvedProgram = $memberProgram;
                            }
                        }
                    }

                    $groupPayload = [
                        'id' => $groupModel->id,
                        'name' => $groupModel->name,
                        'program' => $resolvedProgram,
                        'programSetName' => $groupModel->programSet?->name,
                        'academicYear' => $groupModel->programSet?->academicYear?->label ?? $groupModel->programSet?->school_year,
                        'adviserName' => $hasGroupAdvisersTable ? $resolveUserName($groupModel->adviserAssignment?->adviser) : null,
                        'instructorName' => $resolveUserName($groupModel->programSet?->instructor),
                        'leaderName' => $resolveUserName($groupModel->leader),
                        'membersCount' => (int) ($groupModel->members_count ?? 0),
                        'members' => $groupModel->members
                            ->map(function (User $member) use ($resolveUserName): array {
                                $rawRole = is_string($member->pivot?->role) ? trim($member->pivot->role) : '';
                                $formattedRole = $rawRole !== ''
                                    ? ucwords(str_replace(['_', '-'], ' ', strtolower($rawRole)))
                                    : 'Member';

                                return [
                                    'id' => (int) $member->id,
                                    'name' => $resolveUserName($member),
                                    'role' => $formattedRole,
                                ];
                            })
                            ->sortBy('name')
                            ->values()
                            ->all(),
                    ];

                    $approvedSubmission = $groupModel->approvedConceptSubmission;
                    if ($approvedSubmission instanceof DocumentSubmission) {
                        $approvedConcept = [
                            'id' => (int) $approvedSubmission->id,
                            'title' => (string) $approvedSubmission->file_name,
                            'requirementType' => (string) ($approvedSubmission->requirement?->requirement_type ?? 'Concept Paper'),
                            'submittedAt' => $approvedSubmission->created_at?->format('Y-m-d H:i'),
                            'instructorStatus' => (string) ($approvedSubmission->status ?? 'Submitted'),
                            'adviserStatus' => (string) ($approvedSubmission->adviser_status ?? 'Submitted'),
                            'titleCategoryId' => $approvedSubmission->title_category_id,
                            'titleCategoryName' => $approvedSubmission->titleCategory?->name,
                            'fileUrl' => route('dean.document-submissions.file', ['submission' => $approvedSubmission->id]),
                        ];
                    }

                    if ($resolvedProgram !== null && Schema::hasTable('title_categories')) {
                        $categoryOptions = TitleCategory::query()
                            ->where('program', $resolvedProgram)
                            ->orderBy('name')
                            ->get(['id', 'name', 'description'])
                            ->map(fn (TitleCategory $category): array => [
                                'id' => $category->id,
                                'name' => $category->name,
                                'description' => $category->description,
                            ])
                            ->values()
                            ->all();

                        $canSetCategory = Schema::hasTable('document_submissions')
                            && Schema::hasColumn('document_submissions', 'title_category_id')
                            && $approvedSubmission instanceof DocumentSubmission;
                    }
                }
            }
        } catch (\Throwable) {
            $groupPayload = null;
            $approvedConcept = null;
            $categoryOptions = [];
            $canSetCategory = false;
        }

        return Inertia::render('Dean/project-details', [
            'group' => $groupPayload,
            'approvedConcept' => $approvedConcept,
            'categoryOptions' => $categoryOptions,
            'canSetCategory' => $canSetCategory,
        ]);
    })->name('dean.project-details');
    Route::get('/document-submissions/{submission}/file', function (DocumentSubmission $submission) {
        $deanProgramScope = ['BSIT', 'BSIS'];

        $submission->loadMissing('group.programSet');
        $submissionProgram = $submission->group?->programSet?->program;

        if (! in_array($submissionProgram, $deanProgramScope, true)) {
            abort(404);
        }

        if (
            ! is_string($submission->file_path)
            || trim($submission->file_path) === ''
            || ! Schema::hasTable('document_submissions')
        ) {
            abort(404);
        }

        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        if (! $disk->exists($submission->file_path)) {
            abort(404);
        }

        $filePath = $disk->path($submission->file_path);

        return response()->file($filePath, [
            'Content-Disposition' => 'inline; filename="'.($submission->file_name ?: 'concept-paper.pdf').'"',
        ]);
    })->whereNumber('submission')->name('dean.document-submissions.file');
    Route::put('/project-details/{group}/category', UpdateDeanProjectCategoryController::class)
        ->whereNumber('group')
        ->name('dean.project-details.category.update');
    Route::get('/students', function () {
        return Inertia::render('Dean/students');
    })->name('dean.students');
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
    Route::get('/reports', function () {
        return Inertia::render('Dean/reports');
    })->name('dean.reports');
});
