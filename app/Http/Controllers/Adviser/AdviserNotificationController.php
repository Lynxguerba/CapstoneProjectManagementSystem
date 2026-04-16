<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\MarkAllAdviserNotificationsReadRequest;
use App\Models\DefenseSchedule;
use App\Models\DocumentSubmission;
use App\Models\SiteWideNotification;
use App\Models\UserNotificationState;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdviserNotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            abort(403);
        }

        $notifications = collect();
        $loadError = null;

        try {
            $notifications = $this->buildNotifications($userId);
        } catch (\Throwable) {
            $notifications = collect();
            $loadError = 'Unable to load notifications right now. Please refresh and try again.';
        }

        $notificationKeys = $notifications
            ->pluck('key')
            ->filter(static fn ($value): bool => is_string($value) && $value !== '')
            ->values()
            ->all();

        $statesByKey = $this->resolveStatesByKey($userId, $notificationKeys);

        $visibleNotifications = $notifications
            ->filter(function (array $notification) use ($statesByKey): bool {
                $state = $statesByKey[$notification['key']] ?? null;

                return ! ($state['dismissed_at'] ?? null);
            })
            ->map(function (array $notification) use ($statesByKey): array {
                $state = $statesByKey[$notification['key']] ?? null;
                $isRead = (bool) ($state['read_at'] ?? null);

                return [
                    ...$notification,
                    'is_read' => $isRead,
                    'read_status' => $isRead ? 'Read' : 'Unread',
                ];
            })
            ->values();

        $unreadCount = $visibleNotifications->where('is_read', false)->count();

        return Inertia::render('Adviser/notifications', [
            'notifications' => $visibleNotifications->all(),
            'notificationMeta' => [
                'types' => $visibleNotifications
                    ->pluck('type')
                    ->filter(static fn ($type): bool => is_string($type) && $type !== '')
                    ->unique()
                    ->values()
                    ->all(),
                'totalCount' => $visibleNotifications->count(),
                'unreadCount' => $unreadCount,
                'readCount' => $visibleNotifications->count() - $unreadCount,
                'loadError' => $loadError,
                'stateEnabled' => $this->notificationStateTableExists(),
            ],
        ]);
    }

    public function markAsRead(Request $request, string $notificationKey): RedirectResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            abort(403);
        }

        if (! $this->notificationStateTableExists()) {
            return back()->with('error', 'Notification actions are unavailable. Run migrations first.');
        }

        $normalizedNotificationKey = $this->normalizeNotificationKey($notificationKey);
        if ($normalizedNotificationKey === null) {
            return back()->with('error', 'Invalid notification key.');
        }

        UserNotificationState::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'notification_key' => $normalizedNotificationKey,
            ],
            [
                'read_at' => now(),
            ],
        );

        return back()->with('success', 'Notification marked as read.');
    }

    public function markAllAsRead(MarkAllAdviserNotificationsReadRequest $request): RedirectResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            abort(403);
        }

        if (! $this->notificationStateTableExists()) {
            return back()->with('error', 'Notification actions are unavailable. Run migrations first.');
        }

        $validated = $request->validated();
        $notificationKeys = collect($validated['notification_keys'] ?? [])
            ->map(fn ($notificationKey) => is_string($notificationKey) ? $this->normalizeNotificationKey($notificationKey) : null)
            ->filter(static fn ($notificationKey): bool => is_string($notificationKey) && $notificationKey !== '')
            ->unique()
            ->values()
            ->all();

        if (count($notificationKeys) === 0) {
            return back()->with('error', 'No notifications were selected.');
        }

        $now = now();
        $rows = collect($notificationKeys)
            ->map(fn (string $notificationKey): array => [
                'user_id' => $userId,
                'notification_key' => $notificationKey,
                'read_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        UserNotificationState::query()->upsert(
            $rows,
            ['user_id', 'notification_key'],
            ['read_at', 'updated_at'],
        );

        return back()->with('success', 'Selected notifications marked as read.');
    }

    public function dismiss(Request $request, string $notificationKey): RedirectResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            abort(403);
        }

        if (! $this->notificationStateTableExists()) {
            return back()->with('error', 'Notification actions are unavailable. Run migrations first.');
        }

        $normalizedNotificationKey = $this->normalizeNotificationKey($notificationKey);
        if ($normalizedNotificationKey === null) {
            return back()->with('error', 'Invalid notification key.');
        }

        UserNotificationState::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'notification_key' => $normalizedNotificationKey,
            ],
            [
                'read_at' => now(),
                'dismissed_at' => now(),
            ],
        );

        return back()->with('success', 'Notification dismissed.');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function buildNotifications(int $userId): Collection
    {
        return $this->buildSiteWideNotifications()
            ->concat($this->buildSubmissionNotifications($userId))
            ->concat($this->buildScheduleNotifications($userId))
            ->sortByDesc('timestamp')
            ->values()
            ->map(static function (array $notification): array {
                unset($notification['timestamp']);

                return $notification;
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function buildSiteWideNotifications(): Collection
    {
        $siteWideNotificationTable = $this->resolveSiteWideNotificationTable();
        if ($siteWideNotificationTable === null) {
            return collect();
        }

        $siteWideNotificationModel = new SiteWideNotification;
        $siteWideNotificationModel->setTable($siteWideNotificationTable);

        return $siteWideNotificationModel
            ->newQuery()
            ->whereNotNull('message')
            ->where('message', '!=', '')
            ->orderByDesc('id')
            ->limit(30)
            ->get(['id', 'message', 'created_at'])
            ->map(function (SiteWideNotification $notification): array {
                $createdAt = $notification->created_at;
                $message = trim((string) $notification->message);

                return [
                    'key' => 'site-wide-'.$notification->id,
                    'type' => 'Announcement',
                    'title' => 'System announcement',
                    'message' => $message,
                    'meta' => null,
                    'event_status' => 'Published',
                    'created_at' => $createdAt?->toIso8601String(),
                    'created_at_label' => $createdAt?->format('Y-m-d H:i') ?? 'Unknown time',
                    'action_url' => route('adviser.dashboard'),
                    'timestamp' => $createdAt?->getTimestamp() ?? 0,
                ];
            })
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function buildSubmissionNotifications(int $userId): Collection
    {
        if (
            ! Schema::hasTable('document_submissions')
            || ! Schema::hasTable('groups')
            || ! Schema::hasTable('group_advisers')
        ) {
            return collect();
        }

        return DocumentSubmission::query()
            ->with([
                'group:id,name',
                'requirement:id,stage,requirement_type',
            ])
            ->whereHas('group.adviserAssignment', fn ($query) => $query->where('adviser_id', $userId))
            ->orderByDesc('created_at')
            ->limit(40)
            ->get([
                'id',
                'group_id',
                'document_requirement_id',
                'file_name',
                'status',
                'created_at',
            ])
            ->map(function (DocumentSubmission $submission): array {
                $createdAt = $submission->created_at;
                $groupName = trim((string) ($submission->group?->name ?? 'Group'));
                $fileName = trim((string) ($submission->file_name ?? 'Document'));
                $stage = is_string($submission->requirement?->stage) ? trim($submission->requirement->stage) : '';
                $requirementType = is_string($submission->requirement?->requirement_type) ? trim($submission->requirement->requirement_type) : '';
                $status = $this->normalizeSubmissionStatus((string) $submission->status);

                $metaParts = [];

                if ($stage !== '') {
                    $metaParts[] = $stage.' Stage';
                }

                if ($requirementType !== '') {
                    $metaParts[] = $requirementType;
                }

                return [
                    'key' => 'adviser-submission-'.$submission->id,
                    'type' => 'Document',
                    'title' => $this->resolveSubmissionTitle($status),
                    'message' => $groupName.' uploaded '.$fileName.'.',
                    'meta' => count($metaParts) > 0 ? implode(' • ', $metaParts) : null,
                    'event_status' => $status,
                    'created_at' => $createdAt?->toIso8601String(),
                    'created_at_label' => $createdAt?->format('Y-m-d H:i') ?? 'Unknown time',
                    'action_url' => route('adviser.documents'),
                    'timestamp' => $createdAt?->getTimestamp() ?? 0,
                ];
            })
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function buildScheduleNotifications(int $userId): Collection
    {
        if (
            ! Schema::hasTable('defense_schedules')
            || ! Schema::hasTable('groups')
            || ! Schema::hasTable('group_advisers')
        ) {
            return collect();
        }

        return DefenseSchedule::query()
            ->with([
                'group:id,name',
                'room:id,name',
            ])
            ->whereHas('group.adviserAssignment', fn ($query) => $query->where('adviser_id', $userId))
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->limit(30)
            ->get([
                'id',
                'group_id',
                'room_id',
                'scheduled_date',
                'start_time',
                'stage',
                'status',
                'created_at',
                'updated_at',
            ])
            ->map(function (DefenseSchedule $schedule): array {
                $scheduledDateLabel = $schedule->scheduled_date?->format('M d, Y');
                $startTimeLabel = $this->formatTimeLabel($schedule->start_time);
                $roomName = is_string($schedule->room?->name) ? trim($schedule->room->name) : '';
                $status = is_string($schedule->status) && trim($schedule->status) !== '' ? trim($schedule->status) : 'Pending';
                $stage = is_string($schedule->stage) && trim($schedule->stage) !== '' ? trim($schedule->stage) : 'Defense';
                $groupName = is_string($schedule->group?->name) && trim($schedule->group->name) !== '' ? trim($schedule->group->name) : 'Group';

                $metaParts = [];

                if ($scheduledDateLabel !== null) {
                    $metaParts[] = $scheduledDateLabel;
                }

                if ($startTimeLabel !== null) {
                    $metaParts[] = $startTimeLabel;
                }

                if ($roomName !== '') {
                    $metaParts[] = $roomName;
                }

                $notificationDate = $schedule->updated_at ?? $schedule->created_at;

                return [
                    'key' => 'adviser-schedule-'.$schedule->id,
                    'type' => 'Schedule',
                    'title' => strcasecmp($status, 'Cancelled') === 0 ? 'Defense schedule cancelled' : 'Defense schedule updated',
                    'message' => $groupName.' '.$stage.' defense schedule was updated.',
                    'meta' => count($metaParts) > 0 ? implode(' • ', $metaParts) : null,
                    'event_status' => $status,
                    'created_at' => $notificationDate?->toIso8601String(),
                    'created_at_label' => $notificationDate?->format('Y-m-d H:i') ?? 'Unknown time',
                    'action_url' => route('adviser.schedule'),
                    'timestamp' => $notificationDate?->getTimestamp() ?? 0,
                ];
            })
            ->values();
    }

    /**
     * @param  array<int, string>  $notificationKeys
     * @return array<string, array<string, mixed>>
     */
    private function resolveStatesByKey(int $userId, array $notificationKeys): array
    {
        if (! $this->notificationStateTableExists() || count($notificationKeys) === 0) {
            return [];
        }

        return UserNotificationState::query()
            ->where('user_id', $userId)
            ->whereIn('notification_key', $notificationKeys)
            ->get(['notification_key', 'read_at', 'dismissed_at'])
            ->mapWithKeys(static fn (UserNotificationState $state): array => [
                $state->notification_key => [
                    'read_at' => $state->read_at,
                    'dismissed_at' => $state->dismissed_at,
                ],
            ])
            ->all();
    }

    private function normalizeSubmissionStatus(string $status): string
    {
        $normalizedStatus = trim($status);

        if ($normalizedStatus === 'Revision Required') {
            return 'Revision Required';
        }

        if ($normalizedStatus === 'Approved') {
            return 'Approved';
        }

        if ($normalizedStatus === 'Submitted') {
            return 'Submitted';
        }

        return $normalizedStatus !== '' ? $normalizedStatus : 'Submitted';
    }

    private function resolveSubmissionTitle(string $status): string
    {
        return match ($status) {
            'Approved' => 'Document approved',
            'Revision Required' => 'Document needs revision',
            default => 'New document submission',
        };
    }

    private function formatTimeLabel(?string $time): ?string
    {
        if (! is_string($time) || trim($time) === '') {
            return null;
        }

        $segments = explode(':', $time);
        if (count($segments) < 2) {
            return $time;
        }

        $hours = (int) $segments[0];
        $minutes = (int) $segments[1];
        $period = $hours >= 12 ? 'PM' : 'AM';
        $normalizedHours = $hours % 12 === 0 ? 12 : $hours % 12;

        return sprintf('%d:%02d %s', $normalizedHours, $minutes, $period);
    }

    private function normalizeNotificationKey(string $notificationKey): ?string
    {
        $normalizedNotificationKey = trim($notificationKey);

        if ($normalizedNotificationKey === '' || strlen($normalizedNotificationKey) > 191) {
            return null;
        }

        return preg_match('/^[A-Za-z0-9\-]+$/', $normalizedNotificationKey) === 1
            ? $normalizedNotificationKey
            : null;
    }

    private function notificationStateTableExists(): bool
    {
        return Schema::hasTable('user_notification_states');
    }

    private function resolveSiteWideNotificationTable(): ?string
    {
        if (Schema::hasTable(SiteWideNotification::TABLE)) {
            return SiteWideNotification::TABLE;
        }

        if (Schema::hasTable('site_wide_notifications')) {
            return 'site_wide_notifications';
        }

        return null;
    }
}
