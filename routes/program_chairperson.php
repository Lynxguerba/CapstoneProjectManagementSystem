<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::middleware(['auth', 'role:program_chairperson'])->prefix('program_chairperson')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('ProgramChairperson/dashboard');
    })->name('program_chairperson.dashboard');
    Route::get('/concept-titles', function () {
        $assignedProgram = null;
        $groups = [];
        $programSetOptions = [];
        $instructorOptions = [];
        $adviserOptions = [];

        try {
            $user = Auth::guard('web')->user();
            $rawAssignedProgram = Schema::hasTable('users') && Schema::hasColumn('users', 'program')
                ? $user?->program
                : null;
            $normalizedAssignedProgram = is_string($rawAssignedProgram) ? strtoupper(trim($rawAssignedProgram)) : null;
            $assignedProgram = in_array($normalizedAssignedProgram, ['BSIT', 'BSIS'], true)
                ? $normalizedAssignedProgram
                : null;

            if ($assignedProgram !== null && class_exists(Group::class) && Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
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
                    ])
                    ->whereHas('programSet', fn ($query) => $query->where('program', $assignedProgram))
                    ->withCount('members')
                    ->orderByDesc('created_at');

                if ($hasGroupAdvisersTable) {
                    $groupsQuery->with(['adviserAssignment.adviser:id,name,first_name,last_name']);
                }

                $groups = $groupsQuery
                    ->get()
                    ->map(function (Group $group) use ($resolveUserName, $hasGroupAdvisersTable): array {
                        $adviserName = $hasGroupAdvisersTable
                            ? $resolveUserName($group->adviserAssignment?->adviser)
                            : '';
                        $instructorName = $resolveUserName($group->programSet?->instructor);

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $group->programSet?->id,
                            'program_set_name' => $group->programSet?->name,
                            'adviser_name' => $adviserName,
                            'instructor_name' => $instructorName,
                            'leader_name' => $resolveUserName($group->leader),
                            'members_count' => (int) ($group->members_count ?? 0),
                        ];
                    })
                    ->values()
                    ->all();

                $programSetOptions = collect($groups)
                    ->filter(fn (array $group): bool => isset($group['program_set_id']) && is_int($group['program_set_id']))
                    ->map(fn (array $group): array => [
                        'id' => $group['program_set_id'],
                        'name' => is_string($group['program_set_name']) ? $group['program_set_name'] : 'Unnamed Set',
                    ])
                    ->unique('id')
                    ->sortBy('name')
                    ->values()
                    ->all();

                $instructorOptions = collect($groups)
                    ->pluck('instructor_name')
                    ->filter(fn ($name): bool => is_string($name) && trim($name) !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                $adviserOptions = collect($groups)
                    ->pluck('adviser_name')
                    ->filter(fn ($name): bool => is_string($name) && trim($name) !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $groups = [];
            $programSetOptions = [];
            $instructorOptions = [];
            $adviserOptions = [];
        }

        return Inertia::render('ProgramChairperson/concept-titles', [
            'groups' => $groups,
            'programSetOptions' => $programSetOptions,
            'instructorOptions' => $instructorOptions,
            'adviserOptions' => $adviserOptions,
            'assignedProgram' => $assignedProgram,
        ]);
    })->name('program_chairperson.concept-titles');
    Route::get('/concept-titles/{group}/view', function (int $group) {
        $assignedProgram = null;
        $groupPayload = null;
        $conceptSubmissions = [];

        try {
            $user = Auth::guard('web')->user();
            $rawAssignedProgram = Schema::hasTable('users') && Schema::hasColumn('users', 'program')
                ? $user?->program
                : null;
            $normalizedAssignedProgram = is_string($rawAssignedProgram) ? strtoupper(trim($rawAssignedProgram)) : null;
            $assignedProgram = in_array($normalizedAssignedProgram, ['BSIT', 'BSIS'], true)
                ? $normalizedAssignedProgram
                : null;

            if (
                $assignedProgram !== null
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
                        'programSet.academicYear:id,label',
                        'programSet.instructor:id,name,first_name,last_name',
                    ])
                    ->when(
                        $hasGroupAdvisersTable,
                        fn (Builder $query): Builder => $query->with('adviserAssignment.adviser:id,name,first_name,last_name')
                    )
                    ->whereKey($group)
                    ->whereHas('programSet', fn (Builder $query): Builder => $query->where('program', $assignedProgram))
                    ->first();

                if ($groupModel instanceof Group) {
                    $groupPayload = [
                        'id' => $groupModel->id,
                        'name' => $groupModel->name,
                        'programSetName' => $groupModel->programSet?->name,
                        'academicYear' => $groupModel->programSet?->academicYear?->label ?? $groupModel->programSet?->school_year,
                        'adviserName' => $hasGroupAdvisersTable ? $resolveUserName($groupModel->adviserAssignment?->adviser) : null,
                        'instructorName' => $resolveUserName($groupModel->programSet?->instructor),
                    ];

                    $conceptRequirementIds = collect();
                    if (class_exists(DocumentRequirement::class) && Schema::hasTable('document_requirements')) {
                        $baseRequirements = DocumentRequirement::query()
                            ->where('stage', 'Concept')
                            ->when(
                                is_int($groupModel->programSet?->academic_year_id),
                                fn (Builder $query): Builder => $query->where('academic_year_id', $groupModel->programSet?->academic_year_id)
                            )
                            ->orderBy('due_date')
                            ->orderByDesc('id');

                        $keywordMatchedRequirements = (clone $baseRequirements)
                            ->whereRaw('LOWER(requirement_type) like ?', ['%concept%'])
                            ->get(['id']);

                        $conceptRequirementIds = ($keywordMatchedRequirements->isNotEmpty() ? $keywordMatchedRequirements : $baseRequirements->get(['id']))
                            ->pluck('id')
                            ->map(fn (mixed $id): int => (int) $id)
                            ->values();
                    }

                    if (
                        class_exists(DocumentSubmission::class)
                        && Schema::hasTable('document_submissions')
                        && $conceptRequirementIds->isNotEmpty()
                    ) {
                        $approvedConceptSubmissionId = Schema::hasColumn('groups', 'approved_concept_submission_id')
                            && is_numeric($groupModel->approved_concept_submission_id)
                            ? (int) $groupModel->approved_concept_submission_id
                            : null;

                        $conceptSubmissions = DocumentSubmission::query()
                            ->with('requirement:id,requirement_type')
                            ->where('group_id', $groupModel->id)
                            ->whereIn('document_requirement_id', $conceptRequirementIds->all())
                            ->orderByDesc('created_at')
                            ->get([
                                'id',
                                'document_requirement_id',
                                'file_name',
                                'file_path',
                                'status',
                                'adviser_status',
                                'created_at',
                            ])
                            ->map(function (DocumentSubmission $submission) use ($approvedConceptSubmissionId): array {
                                $panelistApprovalStatus = 'Pending';
                                if ($approvedConceptSubmissionId !== null) {
                                    $panelistApprovalStatus = $approvedConceptSubmissionId === (int) $submission->id
                                        ? 'Approved'
                                        : 'Rejected';
                                }

                                return [
                                    'id' => (int) $submission->id,
                                    'title' => (string) $submission->file_name,
                                    'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Concept Paper'),
                                    'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                                    'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                                    'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                                    'panelistApprovalStatus' => $panelistApprovalStatus,
                                    'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                                ];
                            })
                            ->filter(
                                fn (array $submission): bool => in_array($submission['panelistApprovalStatus'], ['Approved', 'Rejected'], true)
                            )
                            ->values()
                            ->all();
                    }
                }
            }
        } catch (\Throwable) {
            $groupPayload = null;
            $conceptSubmissions = [];
        }

        return Inertia::render('ProgramChairperson/concept-title-results', [
            'assignedProgram' => $assignedProgram,
            'group' => $groupPayload,
            'conceptSubmissions' => $conceptSubmissions,
        ]);
    })->whereNumber('group')->name('program_chairperson.concept-titles.view');
    Route::get('/pre-deployment-letters', function () {
        return Inertia::render('ProgramChairperson/pre-deployment-letters');
    })->name('program_chairperson.pre-deployment-letters');
    Route::get('/deployment-approval', function () {
        return Inertia::render('ProgramChairperson/deployment-approval');
    })->name('program_chairperson.deployment-approval');
    Route::get('/deployment-monitoring', function () {
        return Inertia::render('ProgramChairperson/deployment-monitoring');
    })->name('program_chairperson.deployment-monitoring');
    Route::get('/post-deployment-review', function () {
        return Inertia::render('ProgramChairperson/post-deployment-review');
    })->name('program_chairperson.post-deployment-review');
    Route::get('/document-approval', function () {
        return Inertia::render('ProgramChairperson/document-approval');
    })->name('program_chairperson.document-approval');
    Route::get('/deployment-history', function () {
        return Inertia::render('ProgramChairperson/deployment-history');
    })->name('program_chairperson.deployment-history');
    Route::get('/notifications', function () {
        return Inertia::render('ProgramChairperson/notifications');
    })->name('program_chairperson.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('ProgramChairperson/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('program_chairperson.settings');
    Route::put('/settings/password', \App\Http\Controllers\UpdatePasswordController::class)->name('program_chairperson.settings.password.update');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.delete');
});
