<?php

use App\Http\Controllers\Adviser\AdviserLiveDefenseController;
use App\Http\Controllers\Adviser\AdviserNotificationController;
use App\Http\Controllers\Adviser\AdviserScheduleController;
use App\Http\Controllers\Adviser\ApproveGroupAdviserRequestController;
use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\DestroyAdviserLiveDefenseCommentController;
use App\Http\Controllers\Adviser\DismissGroupAdviserRequestController;
use App\Http\Controllers\Adviser\GenerateAdviserConceptVerdictMinutesController;
use App\Http\Controllers\Adviser\GenerateRecommendationForTitleDefenseController;
use App\Http\Controllers\Adviser\StoreAdviserLiveDefenseCommentController;
use App\Http\Controllers\Adviser\UpdateAdviserAvailabilityController;
use App\Http\Controllers\Adviser\UpdateAdviserConceptSubmissionStatusController;
use App\Http\Controllers\Adviser\UpdateAdviserProgramUtilitiesController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\Panelist\DeleteGroupAcknowledgementReceiptSignatureController;
use App\Http\Controllers\Panelist\UpsertGroupAcknowledgementReceiptSignatureController;
use App\Models\AdviserAvailability;
use App\Models\AdviserProgramUtility;
use App\Models\AdviserRecommendationDocument;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAcknowledgementReceipt;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use App\Models\GroupPanelist;
use App\Models\ProgramSet;
use App\Models\StudentProgram;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::middleware(['auth', 'role:adviser'])->prefix('adviser')->group(function () {
    Route::get('/dashboard', function () {
        $userId = Auth::guard('web')->id();
        $groupIds = [];
        $assignedGroupsCount = 0;
        $pendingConceptReviews = 0;
        $pendingDocumentReviews = 0;
        $upcomingDefenses = 0;
        $reviewBuckets = [
            'Approved' => 0,
            'Pending' => 0,
            'For Revision' => 0,
        ];
        $trendLabels = [];
        $trendValues = [];
        $upcomingSchedules = [];
        $notifications = [];
        $scheduleNotifications = collect();

        try {
            if (class_exists(GroupAdviser::class) && Schema::hasTable('group_advisers')) {
                $groupIds = GroupAdviser::query()
                    ->when($userId !== null, fn ($query) => $query->where('adviser_id', $userId))
                    ->pluck('group_id')
                    ->all();
                $assignedGroupsCount = count($groupIds);
            }
        } catch (\Throwable $e) {
            $groupIds = [];
            $assignedGroupsCount = 0;
        }

        $recentSubmissions = collect();

        try {
            if (
                class_exists(DocumentSubmission::class)
                && Schema::hasTable('document_submissions')
                && Schema::hasTable('document_requirements')
                && count($groupIds) > 0
            ) {
                $submissions = DocumentSubmission::query()
                    ->with(['requirement:id,stage,requirement_type', 'group:id,name'])
                    ->whereIn('group_id', $groupIds)
                    ->orderByDesc('created_at')
                    ->get(['id', 'group_id', 'document_requirement_id', 'status', 'created_at']);

                $latestSubmissions = $submissions
                    ->groupBy(fn (DocumentSubmission $submission): string => $submission->group_id.'-'.$submission->document_requirement_id)
                    ->map(fn ($items) => $items->first());

                foreach ($latestSubmissions as $submission) {
                    $status = is_string($submission->status) ? $submission->status : '';
                    $stage = is_string($submission->requirement?->stage) ? $submission->requirement->stage : null;

                    if ($status === 'Approved') {
                        $reviewBuckets['Approved'] += 1;
                    } elseif ($status === 'Revision Required') {
                        $reviewBuckets['For Revision'] += 1;
                    } else {
                        $reviewBuckets['Pending'] += 1;
                    }

                    if ($status === 'Submitted') {
                        if ($stage === 'Concept') {
                            $pendingConceptReviews += 1;
                        } else {
                            $pendingDocumentReviews += 1;
                        }
                    }
                }

                $recentSubmissions = $submissions->take(8);

                $now = now();
                $trendStart = $now->copy()->startOfWeek()->subWeeks(5);
                $trendBuckets = collect(range(5, 0))
                    ->map(function (int $offset) use ($trendStart): array {
                        $start = $trendStart->copy()->addWeeks($offset);

                        return [
                            'start' => $start->toDateString(),
                            'label' => $start->format('M d'),
                            'value' => 0,
                        ];
                    })
                    ->keyBy('start');

                $trendSubmissions = DocumentSubmission::query()
                    ->whereIn('group_id', $groupIds)
                    ->where('created_at', '>=', $trendStart->copy()->startOfDay())
                    ->get(['id', 'created_at']);

                foreach ($trendSubmissions as $submission) {
                    $createdAt = $submission->created_at;
                    if (! $createdAt) {
                        continue;
                    }

                    $weekStart = $createdAt->copy()->startOfWeek()->toDateString();
                    if (! $trendBuckets->has($weekStart)) {
                        continue;
                    }

                    $bucket = $trendBuckets->get($weekStart);
                    $bucket['value'] = ($bucket['value'] ?? 0) + 1;
                    $trendBuckets->put($weekStart, $bucket);
                }

                $trendLabels = $trendBuckets->values()->pluck('label')->all();
                $trendValues = $trendBuckets->values()->pluck('value')->all();
            }
        } catch (\Throwable $e) {
            $pendingConceptReviews = 0;
            $pendingDocumentReviews = 0;
            $reviewBuckets = [
                'Approved' => 0,
                'Pending' => 0,
                'For Revision' => 0,
            ];
            $trendLabels = [];
            $trendValues = [];
            $recentSubmissions = collect();
        }

        try {
            if (class_exists(DefenseSchedule::class) && Schema::hasTable('defense_schedules') && count($groupIds) > 0) {
                $today = now()->toDateString();

                $upcomingDefenses = DefenseSchedule::query()
                    ->whereIn('group_id', $groupIds)
                    ->whereIn('status', ['Scheduled', 'Pending'])
                    ->whereDate('scheduled_date', '>=', $today)
                    ->count();

                $upcomingSchedules = DefenseSchedule::query()
                    ->with(['group:id,name', 'room:id,name'])
                    ->whereIn('group_id', $groupIds)
                    ->whereIn('status', ['Scheduled', 'Pending'])
                    ->whereDate('scheduled_date', '>=', $today)
                    ->orderBy('scheduled_date')
                    ->orderBy('start_time')
                    ->limit(5)
                    ->get(['id', 'group_id', 'room_id', 'scheduled_date', 'start_time', 'end_time', 'stage', 'status'])
                    ->map(function (DefenseSchedule $schedule): array {
                        return [
                            'id' => $schedule->id,
                            'group_name' => $schedule->group?->name,
                            'stage' => $schedule->stage,
                            'status' => $schedule->status,
                            'scheduled_date' => $schedule->scheduled_date?->format('Y-m-d'),
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'room_name' => $schedule->room?->name,
                        ];
                    })
                    ->values()
                    ->all();

                $scheduleNotifications = DefenseSchedule::query()
                    ->with(['group:id,name'])
                    ->whereIn('group_id', $groupIds)
                    ->orderByDesc('created_at')
                    ->limit(4)
                    ->get(['id', 'group_id', 'scheduled_date', 'stage', 'status', 'created_at'])
                    ->map(function (DefenseSchedule $schedule): array {
                        $groupName = $schedule->group?->name;
                        $stage = is_string($schedule->stage) ? $schedule->stage : 'Defense';
                        $scheduledDate = $schedule->scheduled_date?->format('M d, Y');
                        $messageParts = array_filter([
                            $groupName,
                            $stage !== 'Defense' ? $stage.' Defense' : 'Defense',
                            $scheduledDate ? 'Scheduled '.$scheduledDate : null,
                        ]);

                        return [
                            'id' => 'schedule-'.$schedule->id,
                            'title' => 'Defense Scheduled',
                            'message' => implode(' • ', $messageParts),
                            'date' => $schedule->created_at?->format('Y-m-d H:i:s') ?? '',
                            'tone' => 'info',
                            'timestamp' => $schedule->created_at?->getTimestamp() ?? 0,
                        ];
                    });
            }
        } catch (\Throwable $e) {
            $upcomingDefenses = 0;
            $upcomingSchedules = [];
            $scheduleNotifications = collect();
        }

        $submissionNotifications = $recentSubmissions->map(function (DocumentSubmission $submission): array {
            $groupName = $submission->group?->name ?? 'Assigned group';
            $requirement = $submission->requirement?->requirement_type;
            $stage = $submission->requirement?->stage;
            $status = is_string($submission->status) ? $submission->status : '';

            $title = match ($status) {
                'Approved' => 'Document Approved',
                'Revision Required' => 'Revision Requested',
                default => 'Document Submitted',
            };

            $tone = match ($status) {
                'Approved' => 'success',
                'Revision Required' => 'warning',
                default => 'info',
            };

            $messageParts = array_filter([
                $groupName,
                $stage ? $stage.' Stage' : null,
                $requirement,
            ]);

            return [
                'id' => 'submission-'.$submission->id,
                'title' => $title,
                'message' => implode(' • ', $messageParts),
                'date' => $submission->created_at?->format('Y-m-d H:i:s') ?? '',
                'tone' => $tone,
                'timestamp' => $submission->created_at?->getTimestamp() ?? 0,
            ];
        });

        $notifications = $submissionNotifications
            ->concat($scheduleNotifications ?? collect())
            ->sortByDesc('timestamp')
            ->take(6)
            ->values()
            ->map(function (array $item): array {
                unset($item['timestamp']);

                return $item;
            })
            ->all();

        if (count($trendLabels) === 0) {
            $trendLabels = collect(range(5, 0))
                ->map(fn (int $offset): string => now()->startOfWeek()->subWeeks($offset)->format('M d'))
                ->values()
                ->all();
            $trendValues = array_fill(0, count($trendLabels), 0);
        }

        return Inertia::render('Adviser/dashboard', [
            'stats' => [
                'assignedGroups' => $assignedGroupsCount,
                'pendingConceptReviews' => $pendingConceptReviews,
                'pendingDocumentReviews' => $pendingDocumentReviews,
                'upcomingDefenses' => $upcomingDefenses,
            ],
            'trend' => [
                'labels' => $trendLabels,
                'values' => $trendValues,
            ],
            'reviewBreakdown' => [
                [
                    'label' => 'Approved',
                    'value' => $reviewBuckets['Approved'],
                    'color' => '#10b981',
                ],
                [
                    'label' => 'Pending',
                    'value' => $reviewBuckets['Pending'],
                    'color' => '#22c55e',
                ],
                [
                    'label' => 'For Revision',
                    'value' => $reviewBuckets['For Revision'],
                    'color' => '#34d399',
                ],
            ],
            'upcomingSchedules' => $upcomingSchedules,
            'notifications' => $notifications,
        ]);
    })->name('adviser.dashboard');
    Route::get('/groups', function () {
        $userId = Auth::guard('web')->id();
        $assignedGroups = [];
        $assignmentRequests = [];

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

        try {
            if (
                class_exists(Group::class)
                && Schema::hasTable('groups')
                && Schema::hasTable('group_advisers')
                && $userId !== null
            ) {
                $assignedGroups = Group::query()
                    ->with(['programSet.academicYear', 'leader', 'members'])
                    ->whereHas('adviserAssignment', fn ($query) => $query->where('adviser_id', $userId))
                    ->withCount('members')
                    ->orderByDesc('created_at')
                    ->get(['id', 'name', 'program_set_id', 'leader_id'])
                    ->map(function (Group $group) use ($resolveUserName): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leader = $group->leader;
                        $leaderName = $resolveUserName($leader);
                        $leaderId = $leader?->id;
                        $leaderEmail = is_string($leader?->email) ? $leader->email : null;

                        $memberRows = $group->members
                            ->filter(fn (User $member) => $leaderId === null || $member->id !== $leaderId)
                            ->map(function (User $member) use ($resolveUserName): array {
                                return [
                                    'id' => $member->id,
                                    'name' => $resolveUserName($member),
                                    'email' => $member->email ?? '',
                                    'role' => $member->pivot?->role,
                                    'is_leader' => false,
                                ];
                            });

                        $members = collect();

                        if ($leaderId !== null) {
                            $members->push([
                                'id' => $leaderId,
                                'name' => $leaderName !== '' ? $leaderName : 'Leader',
                                'email' => $leaderEmail ?? '',
                                'role' => 'Leader',
                                'is_leader' => true,
                            ]);
                        }

                        $members = $members->merge($memberRows)->values()->all();

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'leader_name' => $leaderName !== '' ? $leaderName : null,
                            'members_count' => $group->members_count ?? 0,
                            'members' => $members,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $assignedGroups = [];
        }

        try {
            if (
                class_exists(GroupAdviserRequest::class)
                && Schema::hasTable('group_adviser_requests')
                && $userId !== null
            ) {
                $assignmentRequests = GroupAdviserRequest::query()
                    ->with(['group.programSet.academicYear', 'group.adviserAssignment.adviser', 'group.leader', 'group.members', 'requester'])
                    ->where('adviser_id', $userId)
                    ->where('status', GroupAdviserRequest::STATUS_PENDING)
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (GroupAdviserRequest $request) use ($resolveUserName): array {
                        $group = $request->group;
                        $programSet = $group?->programSet;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $requesterName = $resolveUserName($request->requester);
                        $currentAdviserName = $resolveUserName($group?->adviserAssignment?->adviser);
                        $leader = $group?->leader;
                        $leaderId = $leader?->id;
                        $leaderName = $resolveUserName($leader);
                        $leaderEmail = is_string($leader?->email) ? $leader->email : null;

                        $memberRows = $group?->members
                            ? $group->members
                                ->filter(fn (User $member): bool => $leaderId === null || $member->id !== $leaderId)
                                ->map(function (User $member) use ($resolveUserName): array {
                                    return [
                                        'id' => $member->id,
                                        'name' => $resolveUserName($member),
                                        'email' => $member->email ?? '',
                                        'role' => $member->pivot?->role,
                                        'is_leader' => false,
                                    ];
                                })
                            : collect();

                        $members = collect();

                        if ($leaderId !== null) {
                            $members->push([
                                'id' => $leaderId,
                                'name' => $leaderName !== '' ? $leaderName : 'Leader',
                                'email' => $leaderEmail ?? '',
                                'role' => 'Leader',
                                'is_leader' => true,
                            ]);
                        }

                        $members = $members->merge($memberRows)->values()->all();

                        return [
                            'id' => $request->id,
                            'request_type' => $request->request_type,
                            'group_id' => $group?->id,
                            'group_name' => $group?->name ?? 'Group',
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'requested_by' => $requesterName !== '' ? $requesterName : null,
                            'requested_at' => $request->created_at?->format('Y-m-d H:i:s') ?? null,
                            'current_adviser_name' => $currentAdviserName !== '' ? $currentAdviserName : null,
                            'members' => $members,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $assignmentRequests = [];
        }

        $isAvailable = false;
        $utilityPrograms = collect();

        try {
            if ($userId !== null && Schema::hasTable('adviser_availabilities')) {
                $availability = AdviserAvailability::query()
                    ->where('adviser_id', $userId)
                    ->value('is_available');

                if ($availability !== null) {
                    $isAvailable = (bool) $availability;
                }
            }
        } catch (\Throwable $e) {
            $isAvailable = false;
        }

        try {
            if ($userId !== null && Schema::hasTable('adviser_program_utilities')) {
                $utilityPrograms = AdviserProgramUtility::query()
                    ->where('adviser_id', $userId)
                    ->orderBy('program')
                    ->get(['program', 'max_groups']);
            }
        } catch (\Throwable $e) {
            $utilityPrograms = collect();
        }

        $utilityMap = $utilityPrograms
            ->filter(fn (AdviserProgramUtility $utility): bool => trim((string) $utility->program) !== '')
            ->keyBy('program');

        $assignedByProgram = collect($assignedGroups)
            ->filter(fn (array $group): bool => is_string($group['program'] ?? null) && $group['program'] !== '')
            ->groupBy('program')
            ->map(fn ($items) => $items->count());

        $pendingByProgram = collect($assignmentRequests)
            ->filter(fn (array $request): bool => ($request['request_type'] ?? null) !== GroupAdviserRequest::TYPE_REASSIGN_NOTICE)
            ->filter(fn (array $request): bool => is_string($request['program'] ?? null) && $request['program'] !== '')
            ->groupBy('program')
            ->map(fn ($items) => $items->count());

        $programSummaries = $utilityMap
            ->keys()
            ->merge($assignedByProgram->keys())
            ->merge($pendingByProgram->keys())
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $pendingByProgram): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                    'pending_count' => $pendingByProgram->get($program, 0),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Adviser/groups', [
            'assignedGroups' => $assignedGroups,
            'assignmentRequests' => $assignmentRequests,
            'utilities' => [
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
        ]);
    })->name('adviser.groups');
    Route::get('/utilities', function () {
        $userId = Auth::guard('web')->id();
        $programOptions = [];
        $utilityPrograms = collect();
        $isAvailable = false;
        $assignedByProgram = collect();
        $pendingByProgram = collect();

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
            if ($userId !== null && Schema::hasTable('adviser_availabilities')) {
                $availability = AdviserAvailability::query()
                    ->where('adviser_id', $userId)
                    ->value('is_available');

                if ($availability !== null) {
                    $isAvailable = (bool) $availability;
                }
            }
        } catch (\Throwable $e) {
            $isAvailable = false;
        }

        try {
            if ($userId !== null && Schema::hasTable('adviser_program_utilities')) {
                $utilityPrograms = AdviserProgramUtility::query()
                    ->where('adviser_id', $userId)
                    ->orderBy('program')
                    ->get(['program', 'max_groups']);
            }
        } catch (\Throwable $e) {
            $utilityPrograms = collect();
        }

        try {
            if (
                $userId !== null
                && Schema::hasTable('group_advisers')
                && Schema::hasTable('groups')
                && Schema::hasTable('program_sets')
            ) {
                $assignments = GroupAdviser::query()
                    ->where('adviser_id', $userId)
                    ->with('group.programSet')
                    ->get();

                $assignedByProgram = $assignments
                    ->groupBy(fn (GroupAdviser $assignment): ?string => $assignment->group?->programSet?->program)
                    ->map(fn ($items) => $items->count());
            }
        } catch (\Throwable $e) {
            $assignedByProgram = collect();
        }

        try {
            if ($userId !== null && Schema::hasTable('group_adviser_requests')) {
                $pendingRequests = GroupAdviserRequest::query()
                    ->where('adviser_id', $userId)
                    ->where('status', GroupAdviserRequest::STATUS_PENDING)
                    ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
                    ->with('group.programSet')
                    ->get();

                $pendingByProgram = $pendingRequests
                    ->groupBy(fn (GroupAdviserRequest $request): ?string => $request->group?->programSet?->program)
                    ->map(fn ($items) => $items->count());
            }
        } catch (\Throwable $e) {
            $pendingByProgram = collect();
        }

        $utilityMap = $utilityPrograms
            ->filter(fn (AdviserProgramUtility $utility): bool => trim((string) $utility->program) !== '')
            ->keyBy('program');

        $programSummaries = collect($programOptions)
            ->merge($utilityMap->keys())
            ->merge($assignedByProgram->keys())
            ->merge($pendingByProgram->keys())
            ->filter(fn ($program): bool => is_string($program) && trim($program) !== '')
            ->unique()
            ->sort()
            ->map(function (string $program) use ($utilityMap, $assignedByProgram, $pendingByProgram): array {
                $maxGroups = $utilityMap->get($program)?->max_groups ?? 5;

                return [
                    'program' => $program,
                    'max_groups' => $maxGroups,
                    'assigned_count' => $assignedByProgram->get($program, 0),
                    'pending_count' => $pendingByProgram->get($program, 0),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Adviser/utilities/manage', [
            'programOptions' => $programOptions,
            'utilities' => [
                'is_available' => $isAvailable,
                'programs' => $programSummaries,
            ],
        ]);
    })->name('adviser.utilities');
    Route::post('/utilities/availability', UpdateAdviserAvailabilityController::class)
        ->name('adviser.utilities.availability');
    Route::post('/utilities/programs', UpdateAdviserProgramUtilitiesController::class)
        ->name('adviser.utilities.programs');
    Route::post('/assignment-requests/{assignmentRequest}/approve', ApproveGroupAdviserRequestController::class)
        ->name('adviser.assignment-requests.approve');
    Route::delete('/assignment-requests/{assignmentRequest}', DismissGroupAdviserRequestController::class)
        ->name('adviser.assignment-requests.dismiss');
    Route::get('/group-details', function () {
        return Inertia::render('Adviser/group-details');
    })->name('adviser.group-details');
    Route::get('/concepts', function () {
        $groups = [];
        $hasESignature = false;

        try {
            $user = Auth::guard('web')->user();
            $userId = $user?->id;
            $user?->loadMissing('eSignature');
            $hasESignature = $user?->eSignature !== null;

            if ($userId !== null && class_exists(Group::class) && Schema::hasTable('groups')) {
                $groupsQuery = Group::query()
                    ->with(['programSet.academicYear', 'leader:id,name,first_name,last_name', 'members:id,name,first_name,last_name'])
                    ->whereHas('adviserAssignment', fn ($query) => $query->where('adviser_id', $userId))
                    ->orderByDesc('updated_at')
                    ->get(['id', 'name', 'program_set_id', 'leader_id', 'updated_at']);

                $groupIds = $groupsQuery->pluck('id');
                $conceptSubmissionsByGroup = collect();
                $recommendationRequirementsByAcademicYearId = collect();
                $latestRecommendationByGroupId = collect();

                if (
                    class_exists(DocumentSubmission::class)
                    && Schema::hasTable('document_submissions')
                    && Schema::hasTable('document_requirements')
                ) {
                    $conceptSubmissionsByGroup = DocumentSubmission::query()
                        ->with('requirement')
                        ->whereIn('group_id', $groupIds)
                        ->whereHas('requirement', function ($query): void {
                            $query->where('stage', 'Concept')
                                ->whereRaw('LOWER(requirement_type) like ?', ['%concept%']);
                        })
                        ->orderByDesc('created_at')
                        ->get()
                        ->groupBy('group_id');
                }

                if (class_exists(DocumentRequirement::class) && Schema::hasTable('document_requirements')) {
                    $academicYearIds = $groupsQuery
                        ->map(fn (Group $group): ?int => $group->programSet?->academic_year_id)
                        ->filter()
                        ->unique()
                        ->values();

                    if ($academicYearIds->isNotEmpty()) {
                        $recommendationRequirementsByAcademicYearId = DocumentRequirement::query()
                            ->where('stage', 'Concept')
                            ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
                            ->whereIn('academic_year_id', $academicYearIds->all())
                            ->orderBy('due_date')
                            ->get(['id', 'academic_year_id', 'requirement_type'])
                            ->groupBy('academic_year_id')
                            ->map(fn ($requirements) => $requirements->first());
                    }
                }

                if (
                    class_exists(AdviserRecommendationDocument::class)
                    && Schema::hasTable('adviser_recommendation_documents')
                    && $groupIds->isNotEmpty()
                ) {
                    $latestRecommendationByGroupId = AdviserRecommendationDocument::query()
                        ->whereIn('group_id', $groupIds->all())
                        ->orderByDesc('signed_at')
                        ->orderByDesc('id')
                        ->get(['id', 'group_id', 'file_name', 'file_path', 'signed_at'])
                        ->unique('group_id')
                        ->keyBy('group_id');
                }

                $groups = $groupsQuery
                    ->map(function (Group $group) use ($conceptSubmissionsByGroup, $latestRecommendationByGroupId, $recommendationRequirementsByAcademicYearId): array {
                        $programSet = $group->programSet;
                        $leader = $group->leader;
                        $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $leaderName = trim(
                            implode(' ', array_filter([
                                is_string($leader?->first_name) ? trim($leader->first_name) : '',
                                is_string($leader?->last_name) ? trim($leader->last_name) : '',
                            ])),
                        );

                        if ($leaderName === '') {
                            $leaderName = is_string($leader?->name) && trim($leader->name) !== '' ? trim($leader->name) : 'N/A';
                        }

                        $memberNames = collect([$leader, ...$group->members->all()])
                            ->filter(fn (?User $member): bool => $member instanceof User)
                            ->map(function (User $member): string {
                                $fullName = trim(implode(' ', array_filter([
                                    is_string($member->first_name) ? trim($member->first_name) : '',
                                    is_string($member->last_name) ? trim($member->last_name) : '',
                                ])));

                                if ($fullName !== '') {
                                    return $fullName;
                                }

                                return is_string($member->name) ? trim($member->name) : '';
                            })
                            ->filter(fn (string $name): bool => $name !== '')
                            ->unique()
                            ->values()
                            ->all();

                        $concepts = $conceptSubmissionsByGroup
                            ->get($group->id, collect())
                            ->map(function (DocumentSubmission $submission): array {
                                $instructorStatus = match ($submission->status) {
                                    'Approved' => 'Approved',
                                    'Revision Required' => 'Revision Required',
                                    default => 'Submitted',
                                };
                                $adviserStatus = match ($submission->adviser_status) {
                                    'Approved' => 'Approved',
                                    'Revision Required' => 'Revision Required',
                                    default => 'Submitted',
                                };

                                return [
                                    'id' => $submission->id,
                                    'title' => $submission->file_name,
                                    'instructor_status' => $instructorStatus,
                                    'adviser_status' => $adviserStatus,
                                    'submitted_at' => $submission->created_at?->format('Y-m-d H:i'),
                                    'adviser_reviewed_at' => $submission->adviser_reviewed_at?->format('Y-m-d H:i'),
                                    'file_url' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                                ];
                            })
                            ->values()
                            ->all();

                        $latestSubmission = $conceptSubmissionsByGroup->get($group->id)?->first();
                        $updatedAt = $latestSubmission?->created_at?->format('Y-m-d') ?? $group->updated_at?->format('Y-m-d');
                        $recommendationRequirement = $recommendationRequirementsByAcademicYearId->get($programSet?->academic_year_id);
                        $recommendationDocument = $latestRecommendationByGroupId->get($group->id);

                        return [
                            'group_id' => $group->id,
                            'group_name' => $group->name,
                            'leader_name' => $leaderName,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'school_year' => $schoolYear,
                            'updated_at' => $updatedAt,
                            'concepts' => $concepts,
                            'member_names' => $memberNames,
                            'has_recommendation_requirement' => $recommendationRequirement !== null,
                            'recommendation_requirement_id' => $recommendationRequirement?->id,
                            'recommendation_requirement_type' => $recommendationRequirement?->requirement_type,
                            'recommendation_document' => $recommendationDocument
                                ? [
                                    'id' => $recommendationDocument->id,
                                    'file_name' => $recommendationDocument->file_name,
                                    'file_url' => Storage::disk('public')->url($recommendationDocument->file_path),
                                    'signed_at' => $recommendationDocument->signed_at?->format('Y-m-d H:i'),
                                ]
                                : null,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
            $hasESignature = false;
        }

        return Inertia::render('Adviser/concepts', [
            'groups' => $groups,
            'hasESignature' => $hasESignature,
        ]);
    })->name('adviser.concepts');
    Route::patch('/concepts/submissions/{submission}/status', UpdateAdviserConceptSubmissionStatusController::class)
        ->name('adviser.concepts.submissions.status');
    Route::post('/concepts/groups/{group}/recommendation-title-defense', GenerateRecommendationForTitleDefenseController::class)
        ->name('adviser.concepts.groups.recommendation-title-defense');
    Route::get('/documents', function () {
        $userId = Auth::guard('web')->id();
        $projects = [];

        try {
            if ($userId !== null && class_exists(Group::class) && Schema::hasTable('groups')) {
                $resolveUserName = static function (?User $user): string {
                    if (! $user) {
                        return '';
                    }

                    $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
                    $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
                    $fullName = $firstName !== '' || $lastName !== ''
                        ? trim($firstName.' '.$lastName)
                        : (is_string($user->name) ? trim($user->name) : '');

                    return $fullName;
                };

                $groupsQuery = Group::query()
                    ->with([
                        'leader:id,name,first_name,last_name',
                        'members:id,name,first_name,last_name',
                        'programSet:id,name,program,instructor_id,academic_year_id',
                        'programSet.academicYear',
                        'approvedConceptSubmission:id,file_name,created_at',
                    ])
                    ->whereHas('adviserAssignment', fn ($query) => $query->where('adviser_id', $userId))
                    ->whereNotNull('approved_concept_submission_id')
                    ->whereHas('approvedConceptSubmission')
                    ->orderByDesc('concept_verdict_decided_at')
                    ->orderByDesc('updated_at');

                $projects = $groupsQuery
                    ->get()
                    ->map(function (Group $group) use ($resolveUserName): array {
                        $academicYearLabel = trim((string) ($group->programSet?->academicYear?->label ?? ''));
                        if ($academicYearLabel !== '') {
                            $academicYearLabel = (string) preg_replace('/^A\\.Y\\s*/i', '', $academicYearLabel);
                        } else {
                            $academicYearLabel = 'N/A';
                        }

                        $approvedConceptTitle = $group->approvedConceptSubmission?->file_name;
                        $authorNames = collect([$group->leader, ...$group->members])
                            ->filter()
                            ->map(fn ($u) => $resolveUserName($u))
                            ->unique()
                            ->filter()
                            ->implode(', ');

                        return [
                            'id' => $group->id,
                            'title' => is_string($approvedConceptTitle) ? $approvedConceptTitle : 'Untitled Concept',
                            'group_name' => $group->name,
                            'academicYear' => $academicYearLabel,
                            'author_names' => $authorNames,
                            'status' => 'Approved',
                            'dateAdded' => $group->concept_verdict_decided_at?->format('M Y')
                                ?? $group->approvedConceptSubmission?->created_at?->format('M Y')
                                ?? 'N/A',
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $projects = [];
        }

        return Inertia::render('Adviser/documents', [
            'projects' => $projects,
        ]);
    })->name('adviser.documents');
    Route::get('/evaluations', function () {
        return Inertia::render('Adviser/evaluations');
    })->name('adviser.evaluations');
    Route::get('/schedule', AdviserScheduleController::class)->name('adviser.schedule');
    Route::get('/live-defense', AdviserLiveDefenseController::class)->name('adviser.live-defense');
    Route::get('/live-defense/acknowledgement', function () {
        $adviserUser = Auth::guard('web')->user();
        $adviserUser?->loadMissing(['eSignature', 'roles']);
        $adviserId = $adviserUser?->id;
        $selectedGroupId = request()->query('group');
        $selectedGroupId = is_numeric($selectedGroupId) ? (int) $selectedGroupId : null;

        if (
            $adviserId === null
            || $selectedGroupId === null
            || ! class_exists(Group::class)
            || ! Schema::hasTable('groups')
            || ! Schema::hasTable('group_advisers')
        ) {
            abort(403);
        }

        $selectedGroup = Group::query()
            ->with([
                'programSet.academicYear',
                'programSet.instructor.eSignature',
                'leader:id,name,first_name,last_name',
                'members:id,name,first_name,last_name',
                'adviserAssignment.adviser.eSignature',
                'panelAssignments.panelist.eSignature',
            ])
            ->where('id', $selectedGroupId)
            ->whereHas('adviserAssignment', fn ($query) => $query->where('adviser_id', $adviserId))
            ->first();

        if (! $selectedGroup instanceof Group) {
            abort(403);
        }

        $resolveUserName = static function (?User $user): string {
            if (! $user instanceof User) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = trim($firstName.' '.$lastName);

            if ($fullName !== '') {
                return $fullName;
            }

            return is_string($user->name) ? trim($user->name) : '';
        };

        $resolveSignaturePayload = static function (?User $user): ?array {
            if (! $user instanceof User || ! $user->relationLoaded('eSignature') || $user->eSignature === null) {
                return null;
            }

            return [
                'signatureData' => $user->eSignature->signature_data,
                'mimeType' => $user->eSignature->mime_type,
            ];
        };

        $requestedStage = request()->query('stage');
        $requestedStage = is_string($requestedStage) && trim($requestedStage) !== '' ? trim($requestedStage) : null;
        $selectedSchedule = null;

        if (Schema::hasTable('defense_schedules')) {
            $baseScheduleQuery = DefenseSchedule::query()->where('group_id', $selectedGroup->id);

            if ($requestedStage !== null) {
                $selectedSchedule = (clone $baseScheduleQuery)
                    ->whereRaw('LOWER(stage) = ?', [strtolower($requestedStage)])
                    ->orderByRaw(
                        "CASE
                            WHEN status = 'Scheduled' THEN 0
                            WHEN status = 'Pending' THEN 1
                            WHEN status = 'Completed' THEN 2
                            ELSE 3
                        END"
                    )
                    ->orderByDesc('scheduled_date')
                    ->orderByDesc('start_time')
                    ->first(['id', 'group_id', 'stage', 'status', 'scheduled_date', 'start_time']);
            }

            if (! $selectedSchedule instanceof DefenseSchedule) {
                $selectedSchedule = (clone $baseScheduleQuery)
                    ->orderByRaw(
                        "CASE
                            WHEN status = 'Scheduled' THEN 0
                            WHEN status = 'Pending' THEN 1
                            WHEN status = 'Completed' THEN 2
                            ELSE 3
                        END"
                    )
                    ->orderByDesc('scheduled_date')
                    ->orderByDesc('start_time')
                    ->first(['id', 'group_id', 'stage', 'status', 'scheduled_date', 'start_time']);
            }
        }

        $resolvedStage = is_string($selectedSchedule?->stage) && trim($selectedSchedule->stage) !== ''
            ? trim($selectedSchedule->stage)
            : ($requestedStage ?? 'Concept');
        $normalizedStage = strtolower($resolvedStage);

        $defenseTypeKey = match ($normalizedStage) {
            'concept', 'concept paper', 'concept papers' => 'concept_presentation',
            'outline' => 'outline_defense',
            'pre-deployment', 'pre deployment' => 'pre_deployment_defense',
            'final', 'final defense', 'finals' => 'final_defense',
            default => 'concept_presentation',
        };

        $defenseDateLabel = $selectedSchedule?->scheduled_date?->format('F d, Y') ?? now()->format('F d, Y');
        $defenseTimeLabel = 'TBD';
        if (is_string($selectedSchedule?->start_time) && trim($selectedSchedule->start_time) !== '') {
            $startTime = Carbon::createFromFormat('H:i:s', $selectedSchedule->start_time);
            $defenseTimeLabel = $startTime !== false ? $startTime->format('g:i A') : $selectedSchedule->start_time;
        }

        $projectLeader = $resolveUserName($selectedGroup->leader);
        $memberNames = $selectedGroup->members
            ->map(fn (User $member): string => $resolveUserName($member))
            ->filter(fn (string $name): bool => $name !== '')
            ->values()
            ->all();

        $dateReceivedLabel = now()->format('F d, Y');
        $receiptRowsByFacultyUserId = collect();
        if (Schema::hasTable('group_acknowledgement_receipts')) {
            $receiptRowsByFacultyUserId = GroupAcknowledgementReceipt::query()
                ->where('group_id', $selectedGroup->id)
                ->where('defense_type_key', $defenseTypeKey)
                ->get([
                    'id',
                    'faculty_user_id',
                    'faculty_role',
                    'amount_received',
                    'date_received',
                    'signed_at',
                ])
                ->keyBy('faculty_user_id');
        }

        $resolveDateReceivedLabel = static function (mixed $value, string $fallback): string {
            if ($value instanceof \DateTimeInterface) {
                return Carbon::instance($value)->format('F d, Y');
            }

            if (is_string($value) && trim($value) !== '') {
                try {
                    return Carbon::parse($value)->format('F d, Y');
                } catch (\Throwable $e) {
                    return $fallback;
                }
            }

            return $fallback;
        };

        $formatAmountLabel = static function (mixed $amount, int $fallback): string {
            $resolvedAmount = is_numeric($amount) ? (int) $amount : $fallback;

            return 'P '.number_format($resolvedAmount, 0);
        };

        $facultyRows = collect();
        $adviser = $selectedGroup->adviserAssignment?->adviser;
        if ($adviser instanceof User) {
            $receiptRow = $receiptRowsByFacultyUserId->get($adviser->id);
            $facultyRows->push([
                'id' => 'adviser-'.$adviser->id,
                'userId' => $adviser->id,
                'name' => strtoupper($resolveUserName($adviser)),
                'role' => is_string($receiptRow?->faculty_role) && trim($receiptRow->faculty_role) !== '' ? $receiptRow->faculty_role : 'ADVISER',
                'amountReceived' => $formatAmountLabel($receiptRow?->amount_received, 500),
                'dateReceived' => $resolveDateReceivedLabel($receiptRow?->date_received, $dateReceivedLabel),
                'signedAt' => $receiptRow?->signed_at?->toIso8601String(),
                'eSignature' => $resolveSignaturePayload($adviser),
            ]);
        }

        $selectedGroup->panelAssignments
            ->sortBy('panel_slot')
            ->each(function (GroupPanelist $assignment) use (
                $facultyRows,
                $resolveUserName,
                $resolveSignaturePayload,
                $dateReceivedLabel,
                $receiptRowsByFacultyUserId,
                $resolveDateReceivedLabel,
                $formatAmountLabel
            ): void {
                $panelist = $assignment->panelist;
                if (! $panelist instanceof User) {
                    return;
                }

                $receiptRow = $receiptRowsByFacultyUserId->get($panelist->id);
                $roleValue = strtolower(trim((string) $assignment->role));
                $roleLabel = is_string($receiptRow?->faculty_role) && trim($receiptRow->faculty_role) !== ''
                    ? trim($receiptRow->faculty_role)
                    : (($roleValue === 'chairman' || (int) $assignment->panel_slot === 1)
                    ? 'PANEL CHAIRMAN'
                    : 'PANEL MEMBER');

                $facultyRows->push([
                    'id' => 'panel-'.$panelist->id,
                    'userId' => $panelist->id,
                    'name' => strtoupper($resolveUserName($panelist)),
                    'role' => $roleLabel,
                    'amountReceived' => $formatAmountLabel($receiptRow?->amount_received, 300),
                    'dateReceived' => $resolveDateReceivedLabel($receiptRow?->date_received, $dateReceivedLabel),
                    'signedAt' => $receiptRow?->signed_at?->toIso8601String(),
                    'eSignature' => $resolveSignaturePayload($panelist),
                ]);
            });

        $instructor = $selectedGroup->programSet?->instructor;

        return Inertia::render('Adviser/evaluation/acknowledgement-receipt', [
            'group' => [
                'id' => $selectedGroup->id,
                'name' => (string) $selectedGroup->name,
                'programSetName' => $selectedGroup->programSet?->program,
                'academicYear' => $selectedGroup->programSet?->academicYear?->label ?? $selectedGroup->programSet?->school_year,
            ],
            'defense' => [
                'typeKey' => $defenseTypeKey,
                'program' => strtoupper(trim((string) ($selectedGroup->programSet?->program ?? ''))),
                'dateLabel' => $defenseDateLabel,
                'timeLabel' => $defenseTimeLabel,
            ],
            'project' => [
                'leaderName' => $projectLeader,
                'memberNames' => $memberNames,
            ],
            'facultyRows' => $facultyRows->values()->all(),
            'instructor' => [
                'name' => $resolveUserName($instructor),
                'eSignature' => $resolveSignaturePayload($instructor),
            ],
        ]);
    })->name('adviser.live-defense.acknowledgement');
    Route::put('/live-defense/acknowledgement/signature', UpsertGroupAcknowledgementReceiptSignatureController::class)
        ->name('adviser.live-defense.acknowledgement.signature.upsert');
    Route::delete('/live-defense/acknowledgement/signature', DeleteGroupAcknowledgementReceiptSignatureController::class)
        ->name('adviser.live-defense.acknowledgement.signature.delete');
    Route::post('/live-defense/groups/{group}/concept-verdict-minutes', GenerateAdviserConceptVerdictMinutesController::class)
        ->name('adviser.live-defense.groups.concept-verdict-minutes');
    Route::post('/live-defense/comments', StoreAdviserLiveDefenseCommentController::class)->name('adviser.live-defense.comments.store');
    Route::delete('/live-defense/comments/{comment}', DestroyAdviserLiveDefenseCommentController::class)->name('adviser.live-defense.comments.destroy');
    Route::get('/verdict', function () {
        return Inertia::render('Adviser/verdict');
    })->name('adviser.verdict');
    Route::get('/minutes', function () {
        return Inertia::render('Adviser/minutes');
    })->name('adviser.minutes');
    Route::get('/notifications', [AdviserNotificationController::class, 'index'])->name('adviser.notifications');
    Route::patch('/notifications/read-all', [AdviserNotificationController::class, 'markAllAsRead'])
        ->name('adviser.notifications.read-all');
    Route::patch('/notifications/{notificationKey}/read', [AdviserNotificationController::class, 'markAsRead'])
        ->where('notificationKey', '[A-Za-z0-9\-]+')
        ->name('adviser.notifications.read');
    Route::delete('/notifications/{notificationKey}', [AdviserNotificationController::class, 'dismiss'])
        ->where('notificationKey', '[A-Za-z0-9\-]+')
        ->name('adviser.notifications.dismiss');
    Route::get('/deadlines', function () {
        return Inertia::render('Adviser/deadlines');
    })->name('adviser.deadlines');
    Route::get('/reports', function () {
        return Inertia::render('Adviser/reports');
    })->name('adviser.reports');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Adviser/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('adviser.settings');
    Route::put('/settings/password', \App\Http\Controllers\UpdatePasswordController::class)->name('adviser.settings.password.update');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('adviser.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('adviser.settings.e-signature.delete');
});
