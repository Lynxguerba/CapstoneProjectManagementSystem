<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\Panelist\DestroyPanelistLiveDefenseCommentController;
use App\Http\Controllers\Panelist\PanelistDashboardController;
use App\Http\Controllers\Panelist\PanelistLiveDefenseController;
use App\Http\Controllers\Panelist\PanelistScheduleController;
use App\Http\Controllers\Panelist\StorePanelistLiveDefenseCommentController;
use App\Http\Controllers\Panelist\UpdatePanelistAvailabilityController;
use App\Http\Controllers\Panelist\UpdatePanelistProgramUtilitiesController;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\PanelistAvailability;
use App\Models\PanelistProgramUtility;
use App\Models\ProgramSet;
use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:panelist'])->prefix('panelist')->group(function () {
    Route::get('/dashboard', PanelistDashboardController::class)->name('panelist.dashboard');
    Route::get('/assigned-groups', function () {
        $panelistId = Auth::guard('web')->id();
        $selectedAcademicYear = request()->query('academic_year');
        $selectedAcademicYear = is_string($selectedAcademicYear) ? $selectedAcademicYear : null;

        $resolveUserName = static function (?User $user): string {
            if (! $user) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        $assignedGroups = [];
        try {
            if (
                $panelistId !== null
                && class_exists(Group::class)
                && Schema::hasTable('groups')
                && Schema::hasTable('group_panelists')
            ) {
                $groupsQuery = Group::query()
                    ->with([
                        'programSet.academicYear',
                        'leader',
                        'members',
                        'adviserAssignment.adviser',
                        'panelAssignments.panelist',
                    ])
                    ->whereHas('panelAssignments', fn ($query) => $query->where('panelist_id', $panelistId))
                    ->withCount('members')
                    ->orderByDesc('updated_at');

                $assignedGroups = $groupsQuery
                    ->get()
                    ->map(function (Group $group) use ($panelistId, $resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = $resolveUserName($group->leader);
                        $currentAssignment = $group->panelAssignments->firstWhere('panelist_id', $panelistId);
                        $adviser = $group->adviserAssignment?->adviser;
                        $adviserName = $resolveUserName($adviser);
                        $students = collect()
                            ->when(
                                $group->leader !== null,
                                fn ($collection) => $collection->push([
                                    'id' => $group->leader?->id,
                                    'name' => $leaderName !== '' ? $leaderName : null,
                                    'email' => $group->leader?->email ?? null,
                                    'role' => 'Leader',
                                ]),
                            )
                            ->merge(
                                $group->members
                                    ->map(function (User $member) use ($resolveUserName): array {
                                        $memberName = $resolveUserName($member);

                                        return [
                                            'id' => $member->id,
                                            'name' => $memberName !== '' ? $memberName : null,
                                            'email' => $member->email ?? null,
                                            'role' => 'Member',
                                        ];
                                    })
                            )
                            ->unique('id')
                            ->values()
                            ->all();
                        $panelists = $group->panelAssignments
                            ->sortBy('panel_slot')
                            ->map(function (GroupPanelist $assignment) use ($resolveUserName): array {
                                $panelist = $assignment->panelist;
                                $panelistName = $resolveUserName($panelist);

                                return [
                                    'id' => $panelist?->id,
                                    'name' => $panelistName !== '' ? $panelistName : null,
                                    'email' => $panelist?->email ?? null,
                                    'slot' => $assignment->panel_slot,
                                    'role' => $assignment->role ?? 'member',
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'members_count' => $group->members_count ?? 0,
                            'panel_role' => $currentAssignment?->role ?? 'member',
                            'panel_slot' => $currentAssignment?->panel_slot,
                            'students' => $students,
                            'adviser' => $adviser !== null ? [
                                'id' => $adviser->id,
                                'name' => $adviserName !== '' ? $adviserName : null,
                                'email' => $adviser->email ?? null,
                            ] : null,
                            'panelists' => $panelists,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $assignedGroups = [];
        }

        $isAvailable = false;
        $utilityPrograms = collect();

        try {
            if ($panelistId !== null && Schema::hasTable('panelist_availabilities')) {
                $availability = PanelistAvailability::query()
                    ->where('panelist_id', $panelistId)
                    ->value('is_available');

                if ($availability !== null) {
                    $isAvailable = (bool) $availability;
                }
            }
        } catch (\Throwable $e) {
            $isAvailable = false;
        }

        try {
            if ($panelistId !== null && Schema::hasTable('panelist_program_utilities')) {
                $utilityPrograms = PanelistProgramUtility::query()
                    ->where('panelist_id', $panelistId)
                    ->orderBy('program')
                    ->get(['program', 'max_groups']);
            }
        } catch (\Throwable $e) {
            $utilityPrograms = collect();
        }

        $utilityMap = $utilityPrograms
            ->filter(fn (PanelistProgramUtility $utility): bool => trim((string) $utility->program) !== '')
            ->keyBy('program');

        $assignedByProgram = collect($assignedGroups)
            ->filter(fn (array $group): bool => is_string($group['program'] ?? null) && $group['program'] !== '')
            ->groupBy('program')
            ->map(fn ($items) => $items->count());

        $programSummaries = $utilityMap
            ->keys()
            ->merge($assignedByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Panelist/assigned-groups', [
            'assignedGroups' => $assignedGroups,
            'selectedAcademicYear' => $selectedAcademicYear,
            'utilities' => [
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
        ]);
    })->name('panelist.assigned-groups');
    Route::get('/utilities', function () {
        $panelistId = Auth::guard('web')->id();
        $programOptions = [];
        $utilityPrograms = collect();
        $isAvailable = false;
        $assignedByProgram = collect();

        try {
            $discoveredPrograms = collect();

            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $discoveredPrograms = $discoveredPrograms->merge(
                    ProgramSet::query()
                        ->select('program')
                        ->distinct()
                        ->orderBy('program')
                        ->pluck('program')
                        ->all(),
                );
            }

            if (class_exists(StudentProgram::class) && Schema::hasTable('student_program')) {
                $discoveredPrograms = $discoveredPrograms->merge(
                    StudentProgram::query()
                        ->select('program')
                        ->distinct()
                        ->orderBy('program')
                        ->pluck('program')
                        ->all(),
                );
            }

            if (class_exists(User::class) && Schema::hasTable('users') && Schema::hasColumn('users', 'program')) {
                $discoveredPrograms = $discoveredPrograms->merge(
                    User::query()
                        ->select('program')
                        ->whereNotNull('program')
                        ->distinct()
                        ->orderBy('program')
                        ->pluck('program')
                        ->all(),
                );
            }

            $programOptions = $discoveredPrograms
                ->map(fn ($program): string => is_string($program) ? strtoupper(trim($program)) : '')
                ->filter(fn (string $program): bool => $program !== '')
                ->merge(['BSIT', 'BSIS'])
                ->unique()
                ->sort()
                ->values()
                ->all();
        } catch (\Throwable $e) {
            $programOptions = ['BSIT', 'BSIS'];
        }

        try {
            if ($panelistId !== null && Schema::hasTable('panelist_availabilities')) {
                $availability = PanelistAvailability::query()
                    ->where('panelist_id', $panelistId)
                    ->value('is_available');

                if ($availability !== null) {
                    $isAvailable = (bool) $availability;
                }
            }
        } catch (\Throwable $e) {
            $isAvailable = false;
        }

        try {
            if ($panelistId !== null && Schema::hasTable('panelist_program_utilities')) {
                $utilityPrograms = PanelistProgramUtility::query()
                    ->where('panelist_id', $panelistId)
                    ->orderBy('program')
                    ->get(['program', 'max_groups']);
            }
        } catch (\Throwable $e) {
            $utilityPrograms = collect();
        }

        try {
            if (
                $panelistId !== null
                && Schema::hasTable('group_panelists')
                && Schema::hasTable('groups')
                && Schema::hasTable('program_sets')
            ) {
                $assignments = GroupPanelist::query()
                    ->where('panelist_id', $panelistId)
                    ->with('group.programSet')
                    ->get();

                $assignedByProgram = $assignments
                    ->groupBy(fn (GroupPanelist $assignment): ?string => $assignment->group?->programSet?->program)
                    ->map(fn ($items) => $items->count());
            }
        } catch (\Throwable $e) {
            $assignedByProgram = collect();
        }

        $utilityMap = $utilityPrograms
            ->filter(fn (PanelistProgramUtility $utility): bool => trim((string) $utility->program) !== '')
            ->keyBy('program');

        $programSummaries = collect($programOptions)
            ->merge($utilityMap->keys())
            ->merge($assignedByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Panelist/utilities/manage', [
            'programOptions' => $programOptions,
            'utilities' => [
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
        ]);
    })->name('panelist.utilities');
    Route::post('/utilities/availability', UpdatePanelistAvailabilityController::class)
        ->name('panelist.utilities.availability');
    Route::post('/utilities/programs', UpdatePanelistProgramUtilitiesController::class)
        ->name('panelist.utilities.programs');
    Route::get('/group-details', function () {
        return Inertia::render('Panelist/group-details');
    })->name('panelist.group-details');
    Route::get('/schedule', PanelistScheduleController::class)->name('panelist.schedule');
    Route::get('/live-defense', PanelistLiveDefenseController::class)->name('panelist.live-defense');
    Route::post('/live-defense/comments', StorePanelistLiveDefenseCommentController::class)->name('panelist.live-defense.comments.store');
    Route::delete('/live-defense/comments/{comment}', DestroyPanelistLiveDefenseCommentController::class)->name('panelist.live-defense.comments.destroy');
    Route::get('/documents', function () {
        return Inertia::render('Panelist/documents/document-list');
    })->name('panelist.documents');
    Route::get('/documents/viewer', function () {
        return Inertia::render('Panelist/documents/document-viewer');
    })->name('panelist.documents.viewer');
    Route::get('/evaluation', function () {
        return Inertia::render('Panelist/evaluation/evaluation-form');
    })->name('panelist.evaluation');
    Route::get('/comments', function () {
        return Inertia::render('Panelist/comments/comments-dashboard');
    })->name('panelist.comments');
    Route::get('/verdict', function () {
        return Inertia::render('Panelist/verdict/verdict-recommendation');
    })->name('panelist.verdict');
    Route::get('/history', function () {
        return Inertia::render('Panelist/history/past-evaluations');
    })->name('panelist.history');
    Route::get('/notifications', function () {
        return Inertia::render('Panelist/notifications');
    })->name('panelist.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Panelist/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('panelist.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('panelist.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('panelist.settings.e-signature.delete');
});
