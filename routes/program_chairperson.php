<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
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
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.delete');
});
