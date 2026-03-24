<?php

use App\Http\Controllers\Adviser\ApproveGroupAdviserRequestController;
use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\DismissGroupAdviserRequestController;
use App\Http\Controllers\Adviser\UpdateAdviserPasswordController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Models\DefenseSchedule;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use App\Models\User;
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
                    ->with(['group.programSet.academicYear', 'group.adviserAssignment.adviser', 'requester'])
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
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $assignmentRequests = [];
        }

        return Inertia::render('Adviser/groups', [
            'assignedGroups' => $assignedGroups,
            'assignmentRequests' => $assignmentRequests,
        ]);
    })->name('adviser.groups');
    Route::post('/assignment-requests/{assignmentRequest}/approve', ApproveGroupAdviserRequestController::class)
        ->name('adviser.assignment-requests.approve');
    Route::delete('/assignment-requests/{assignmentRequest}', DismissGroupAdviserRequestController::class)
        ->name('adviser.assignment-requests.dismiss');
    Route::get('/group-details', function () {
        return Inertia::render('Adviser/group-details');
    })->name('adviser.group-details');
    Route::get('/concepts', function () {
        $groups = [];

        try {
            $userId = Auth::guard('web')->id();
            if ($userId !== null && class_exists(Group::class) && Schema::hasTable('groups')) {
                $groupsQuery = Group::query()
                    ->with(['programSet.academicYear', 'leader:id,name,first_name,last_name'])
                    ->whereHas('adviserAssignment', fn ($query) => $query->where('adviser_id', $userId))
                    ->orderByDesc('updated_at')
                    ->get(['id', 'name', 'program_set_id', 'leader_id', 'updated_at']);

                $groupIds = $groupsQuery->pluck('id');
                $conceptSubmissionsByGroup = collect();

                if (
                    class_exists(DocumentSubmission::class)
                    && Schema::hasTable('document_submissions')
                    && Schema::hasTable('document_requirements')
                ) {
                    $conceptSubmissionsByGroup = DocumentSubmission::query()
                        ->with('requirement')
                        ->whereIn('group_id', $groupIds)
                        ->whereHas('requirement', fn ($query) => $query->where('stage', 'Concept'))
                        ->orderByDesc('created_at')
                        ->get()
                        ->groupBy('group_id');
                }

                $groups = $groupsQuery
                    ->map(function (Group $group) use ($conceptSubmissionsByGroup): array {
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

                        $concepts = $conceptSubmissionsByGroup
                            ->get($group->id, collect())
                            ->map(function (DocumentSubmission $submission): array {
                                $decision = match ($submission->status) {
                                    'Approved' => 'Approved',
                                    'Revision Required' => 'For Revision',
                                    default => 'Pending',
                                };

                                return [
                                    'id' => $submission->id,
                                    'title' => $submission->file_name,
                                    'decision' => $decision,
                                    'submitted_at' => $submission->created_at?->format('Y-m-d H:i'),
                                    'file_url' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                                ];
                            })
                            ->values()
                            ->all();

                        $latestSubmission = $conceptSubmissionsByGroup->get($group->id)?->first();
                        $updatedAt = $latestSubmission?->created_at?->format('Y-m-d') ?? $group->updated_at?->format('Y-m-d');

                        return [
                            'group_id' => $group->id,
                            'group_name' => $group->name,
                            'leader_name' => $leaderName,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'school_year' => $schoolYear,
                            'updated_at' => $updatedAt,
                            'concepts' => $concepts,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $groups = [];
        }

        return Inertia::render('Adviser/concepts', [
            'groups' => $groups,
        ]);
    })->name('adviser.concepts');
    Route::get('/documents', function () {
        return Inertia::render('Adviser/documents');
    })->name('adviser.documents');
    Route::get('/evaluations', function () {
        return Inertia::render('Adviser/evaluations');
    })->name('adviser.evaluations');
    Route::get('/schedule', function () {
        return Inertia::render('Adviser/schedule');
    })->name('adviser.schedule');
    Route::get('/verdict', function () {
        return Inertia::render('Adviser/verdict');
    })->name('adviser.verdict');
    Route::get('/minutes', function () {
        return Inertia::render('Adviser/minutes');
    })->name('adviser.minutes');
    Route::get('/notifications', function () {
        return Inertia::render('Adviser/notifications');
    })->name('adviser.notifications');
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
    Route::put('/settings/password', UpdateAdviserPasswordController::class)->name('adviser.settings.password.update');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('adviser.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('adviser.settings.e-signature.delete');
});
