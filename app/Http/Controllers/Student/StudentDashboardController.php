<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller
{
    /**
     * @var array<string, array{number: int, progress: int}>
     */
    private const STAGE_MAP = [
        'Concept' => ['number' => 1, 'progress' => 20],
        'Outline' => ['number' => 2, 'progress' => 40],
        'Pre-Deployment' => ['number' => 3, 'progress' => 60],
        'Deployment' => ['number' => 4, 'progress' => 80],
        'Final' => ['number' => 5, 'progress' => 100],
    ];

    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $studentId = $student?->id;

        $group = $this->resolveStudentGroup($studentId);
        $teamMembers = $this->buildTeamMembers($group);

        $currentStage = $this->resolveCurrentStage($group);
        $stageMeta = self::STAGE_MAP[$currentStage] ?? self::STAGE_MAP['Concept'];

        $nextDeadline = $this->resolveNextDeadline($group);

        $approvedSubmissionsCount = 0;
        $inReviewSubmissionsCount = 0;
        $recentApprovedSubmissions = [];

        if ($group !== null && Schema::hasTable('document_submissions')) {
            $statusCounts = DocumentSubmission::query()
                ->selectRaw('status, COUNT(*) as total')
                ->where('group_id', $group->id)
                ->groupBy('status')
                ->pluck('total', 'status');

            $approvedSubmissionsCount = (int) ($statusCounts->get('Approved') ?? 0);
            $submittedCount = (int) ($statusCounts->get('Submitted') ?? 0);
            $revisionCount = (int) ($statusCounts->get('Revision Required') ?? 0);
            $inReviewSubmissionsCount = $submittedCount + $revisionCount;

            $recentApprovedSubmissions = $this->buildRecentApprovedSubmissions($group->id, $group->name ?? 'Your Group');
        }

        return Inertia::render('Student/dashboard', [
            'welcomeName' => $this->resolveDisplayName($student),
            'groupName' => $group?->name,
            'stage' => [
                'label' => $currentStage,
                'phaseLabel' => 'Phase '.$stageMeta['number'].' of '.count(self::STAGE_MAP),
                'progress' => $stageMeta['progress'],
            ],
            'stats' => [
                'approvedSubmissions' => $approvedSubmissionsCount,
                'inReviewSubmissions' => $inReviewSubmissionsCount,
                'teamMembers' => count($teamMembers),
                'daysLeft' => $nextDeadline['daysLeft'] ?? null,
            ],
            'nextDeadline' => $nextDeadline,
            'teamMembers' => $teamMembers,
            'recentApprovedSubmissions' => $recentApprovedSubmissions,
        ]);
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');

        $query = Group::query()
            ->with([
                'programSet:id,academic_year_id',
                'leader:id,name,first_name,last_name',
            ]);

        if ($hasGroupMembersTable) {
            $query->with('members:id,name,first_name,last_name');
        }

        $query->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
            $groupQuery->where('leader_id', $studentId);

            if ($hasGroupMembersTable) {
                $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                    $memberQuery->where('users.id', $studentId);
                });
            }
        });

        return $query->first();
    }

    /**
     * @return array<int, array{id: int, name: string, role: string, access: string, initials: string}>
     */
    private function buildTeamMembers(?Group $group): array
    {
        if ($group === null) {
            return [];
        }

        $members = collect();

        if ($group->leader instanceof User) {
            $members->push([
                'id' => $group->leader->id,
                'name' => $this->resolveDisplayName($group->leader),
                'role' => 'Group Leader',
                'access' => 'Full Access',
                'initials' => $this->resolveInitials($group->leader),
            ]);
        }

        if (Schema::hasTable('group_members')) {
            /** @var Collection<int, User> $groupMembers */
            $groupMembers = $group->members instanceof Collection ? $group->members : collect();

            foreach ($groupMembers as $member) {
                if (($group->leader?->id ?? null) === $member->id) {
                    continue;
                }

                $memberRole = is_string($member->pivot?->role) && trim($member->pivot->role) !== ''
                    ? (string) $member->pivot->role
                    : 'Member';

                $normalizedRole = strtolower($memberRole);
                $memberAccess = str_contains($normalizedRole, 'manager') || str_contains($normalizedRole, 'lead')
                    ? 'Full Access'
                    : 'View Only';

                $members->push([
                    'id' => $member->id,
                    'name' => $this->resolveDisplayName($member),
                    'role' => $memberRole,
                    'access' => $memberAccess,
                    'initials' => $this->resolveInitials($member),
                ]);
            }
        }

        return $members
            ->unique('id')
            ->values()
            ->all();
    }

    private function resolveCurrentStage(?Group $group): string
    {
        if ($group === null) {
            return 'Concept';
        }

        if (Schema::hasTable('defense_schedules')) {
            $scheduledStage = DefenseSchedule::query()
                ->where('group_id', $group->id)
                ->orderByDesc('scheduled_date')
                ->orderByDesc('start_time')
                ->value('stage');

            $normalizedScheduledStage = $this->normalizeStage($scheduledStage);
            if ($normalizedScheduledStage !== null) {
                return $normalizedScheduledStage;
            }
        }

        if (Schema::hasTable('document_submissions') && Schema::hasTable('document_requirements')) {
            $latestSubmission = DocumentSubmission::query()
                ->with('requirement:id,stage')
                ->where('group_id', $group->id)
                ->orderByDesc('updated_at')
                ->first(['id', 'document_requirement_id']);

            $normalizedSubmissionStage = $this->normalizeStage($latestSubmission?->requirement?->stage);
            if ($normalizedSubmissionStage !== null) {
                return $normalizedSubmissionStage;
            }
        }

        return 'Concept';
    }

    /**
     * @return array{requirementType: string, dueDate: string, daysLeft: int}|null
     */
    private function resolveNextDeadline(?Group $group): ?array
    {
        if (! Schema::hasTable('document_requirements')) {
            return null;
        }

        $today = now()->startOfDay();
        $academicYearId = $group?->programSet?->academic_year_id;

        $query = DocumentRequirement::query()
            ->whereDate('due_date', '>=', $today->toDateString())
            ->orderBy('due_date');

        if (is_int($academicYearId)) {
            $query->where('academic_year_id', $academicYearId);
        }

        $deadline = $query->first(['id', 'requirement_type', 'due_date']);

        if ($deadline === null && is_int($academicYearId)) {
            $deadline = DocumentRequirement::query()
                ->whereDate('due_date', '>=', $today->toDateString())
                ->orderBy('due_date')
                ->first(['id', 'requirement_type', 'due_date']);
        }

        if ($deadline === null || $deadline->due_date === null) {
            return null;
        }

        return [
            'requirementType' => (string) $deadline->requirement_type,
            'dueDate' => $deadline->due_date->format('Y-m-d'),
            'daysLeft' => $today->diffInDays($deadline->due_date, false),
        ];
    }

    /**
     * @return array<int, array{id: int, title: string, group: string, approvedOn: string}>
     */
    private function buildRecentApprovedSubmissions(int $groupId, string $groupName): array
    {
        $query = DocumentSubmission::query()
            ->where('group_id', $groupId)
            ->where('status', 'Approved')
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get(['id', 'document_requirement_id', 'file_name', 'updated_at']);

        $submissions = $query;

        if (Schema::hasTable('document_requirements')) {
            $submissions->load('requirement:id,requirement_type');
        }

        return $submissions
            ->map(function (DocumentSubmission $submission) use ($groupName): array {
                $title = $submission->requirement?->requirement_type ?? $submission->file_name;

                return [
                    'id' => $submission->id,
                    'title' => (string) $title,
                    'group' => $groupName,
                    'approvedOn' => $submission->updated_at?->format('Y-m-d') ?? '',
                ];
            })
            ->values()
            ->all();
    }

    private function resolveDisplayName(?User $user): string
    {
        if (! $user) {
            return 'Student';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';

        if ($firstName !== '' && $lastName !== '') {
            return $firstName.' '.$lastName;
        }

        if ($firstName !== '') {
            return $firstName;
        }

        if ($lastName !== '') {
            return $lastName;
        }

        return is_string($user->name) && trim($user->name) !== ''
            ? (string) $user->name
            : 'Student';
    }

    private function resolveInitials(?User $user): string
    {
        if (! $user) {
            return 'NA';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';

        $initials = '';
        if ($firstName !== '') {
            $initials .= substr($firstName, 0, 1);
        }

        if ($lastName !== '') {
            $initials .= substr($lastName, 0, 1);
        }

        if ($initials !== '') {
            return strtoupper($initials);
        }

        $name = is_string($user->name) ? trim($user->name) : '';
        if ($name === '') {
            return 'NA';
        }

        $parts = preg_split('/\s+/', $name);
        if (! is_array($parts) || count($parts) === 0) {
            return strtoupper(substr($name, 0, 2));
        }

        $generatedInitials = strtoupper(substr((string) ($parts[0] ?? ''), 0, 1).substr((string) ($parts[1] ?? ''), 0, 1));

        return $generatedInitials !== '' ? $generatedInitials : 'NA';
    }

    private function normalizeStage(mixed $stage): ?string
    {
        if (! is_string($stage)) {
            return null;
        }

        $normalizedStage = strtolower(trim($stage));

        if ($normalizedStage === '') {
            return null;
        }

        if (str_contains($normalizedStage, 'concept')) {
            return 'Concept';
        }

        if (str_contains($normalizedStage, 'outline')) {
            return 'Outline';
        }

        if (str_contains($normalizedStage, 'pre') && str_contains($normalizedStage, 'deploy')) {
            return 'Pre-Deployment';
        }

        if (str_contains($normalizedStage, 'deploy')) {
            return 'Deployment';
        }

        if (str_contains($normalizedStage, 'final')) {
            return 'Final';
        }

        return null;
    }
}
