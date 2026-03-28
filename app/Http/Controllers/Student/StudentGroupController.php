<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DefenseSchedule;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use App\Models\GroupPanelist;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentGroupController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const STAGE_SEQUENCE = [
        'Concept',
        'Outline',
        'Pre-Deployment',
        'Deployment',
        'Final',
    ];

    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $currentStage = $this->resolveCurrentStage($group?->id);

        return Inertia::render('Student/group', [
            'group' => $group !== null ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSet' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
                'currentStage' => $currentStage,
            ] : null,
            'members' => $this->buildGroupMembers($group),
            'adviser' => $group !== null ? $this->resolveAdviser($group->id) : null,
            'pendingAdviserRequest' => $group !== null ? $this->resolvePendingAdviserRequest($group->id) : null,
            'panelists' => $group !== null ? $this->resolvePanelists($group->id) : [],
            'progress' => $this->buildProgressSteps($currentStage),
        ]);
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');
        $hasProgramSetsTable = Schema::hasTable('program_sets');
        $hasAcademicYearsTable = Schema::hasTable('academic_years');

        $query = Group::query()->with('leader:id,name,first_name,last_name,email');

        if ($hasGroupMembersTable) {
            $query->with('members:id,name,first_name,last_name,email');
        }

        if ($hasProgramSetsTable) {
            $query->with('programSet:id,name,academic_year_id');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear:id,label');
            }
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
     * @return array<int, array{id: int, name: string, role: string, email: string|null, isLeader: bool}>
     */
    private function buildGroupMembers(?Group $group): array
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
                'email' => $group->leader->email,
                'isLeader' => true,
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
                    ? $this->formatRoleLabel((string) $member->pivot->role)
                    : 'Member';

                $members->push([
                    'id' => $member->id,
                    'name' => $this->resolveDisplayName($member),
                    'role' => $memberRole,
                    'email' => $member->email,
                    'isLeader' => false,
                ]);
            }
        }

        return $members
            ->unique('id')
            ->values()
            ->all();
    }

    /**
     * @return array{name: string, email: string|null, assignedAt: string|null}|null
     */
    private function resolveAdviser(int $groupId): ?array
    {
        if (! Schema::hasTable('group_advisers')) {
            return null;
        }

        $assignment = GroupAdviser::query()
            ->with('adviser:id,name,first_name,last_name,email')
            ->where('group_id', $groupId)
            ->first(['id', 'group_id', 'adviser_id', 'created_at']);

        if (! $assignment instanceof GroupAdviser || ! $assignment->adviser instanceof User) {
            return null;
        }

        return [
            'name' => $this->resolveDisplayName($assignment->adviser),
            'email' => $assignment->adviser->email,
            'assignedAt' => $assignment->created_at?->format('Y-m-d'),
        ];
    }

    /**
     * @return array{id: int, adviserId: int|null, adviserName: string|null, requestedAt: string|null}|null
     */
    private function resolvePendingAdviserRequest(int $groupId): ?array
    {
        if (! Schema::hasTable('group_adviser_requests')) {
            return null;
        }

        $request = GroupAdviserRequest::query()
            ->with('adviser:id,name,first_name,last_name')
            ->where('group_id', $groupId)
            ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
            ->where('status', GroupAdviserRequest::STATUS_PENDING)
            ->orderByDesc('created_at')
            ->first(['id', 'group_id', 'adviser_id', 'created_at']);

        if (! $request) {
            return null;
        }

        return [
            'id' => $request->id,
            'adviserId' => $request->adviser_id,
            'adviserName' => $this->resolveDisplayName($request->adviser),
            'requestedAt' => $request->created_at?->format('Y-m-d H:i'),
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, role: string, slot: int, email: string|null}>
     */
    private function resolvePanelists(int $groupId): array
    {
        if (! Schema::hasTable('group_panelists')) {
            return [];
        }

        return GroupPanelist::query()
            ->with('panelist:id,name,first_name,last_name,email')
            ->where('group_id', $groupId)
            ->orderBy('panel_slot')
            ->get(['id', 'group_id', 'panelist_id', 'panel_slot', 'role'])
            ->map(function (GroupPanelist $assignment): array {
                $panelist = $assignment->panelist;
                $roleLabel = is_string($assignment->role) ? $this->formatRoleLabel($assignment->role) : 'Member';

                return [
                    'id' => $assignment->id,
                    'name' => $panelist instanceof User ? $this->resolveDisplayName($panelist) : 'Unassigned Panelist',
                    'role' => $roleLabel,
                    'slot' => (int) $assignment->panel_slot,
                    'email' => $panelist?->email,
                ];
            })
            ->values()
            ->all();
    }

    private function resolveCurrentStage(?int $groupId): string
    {
        if ($groupId === null) {
            return 'Concept';
        }

        if (Schema::hasTable('defense_schedules')) {
            $scheduledStage = DefenseSchedule::query()
                ->where('group_id', $groupId)
                ->orderByDesc('scheduled_date')
                ->orderByDesc('start_time')
                ->value('stage');

            $normalizedScheduleStage = $this->normalizeStage($scheduledStage);
            if ($normalizedScheduleStage !== null) {
                return $normalizedScheduleStage;
            }
        }

        if (Schema::hasTable('document_submissions') && Schema::hasTable('document_requirements')) {
            $latestSubmission = DocumentSubmission::query()
                ->with('requirement:id,stage')
                ->where('group_id', $groupId)
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
     * @return array<int, array{label: string, done: bool, current: bool}>
     */
    private function buildProgressSteps(string $currentStage): array
    {
        $currentIndex = array_search($currentStage, self::STAGE_SEQUENCE, true);
        $resolvedCurrentIndex = is_int($currentIndex) ? $currentIndex : 0;

        return collect(self::STAGE_SEQUENCE)
            ->map(function (string $stage, int $index) use ($resolvedCurrentIndex): array {
                return [
                    'label' => $stage,
                    'done' => $index < $resolvedCurrentIndex,
                    'current' => $index === $resolvedCurrentIndex,
                ];
            })
            ->values()
            ->all();
    }

    private function resolveDisplayName(?User $user): string
    {
        if (! $user) {
            return 'Unknown User';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if (is_string($user->name) && trim($user->name) !== '') {
            return (string) $user->name;
        }

        return 'Unknown User';
    }

    private function formatRoleLabel(string $value): string
    {
        $normalized = str_replace(['_', '-'], ' ', trim($value));

        return collect(explode(' ', $normalized))
            ->filter()
            ->map(fn (string $word): string => ucfirst(strtolower($word)))
            ->implode(' ');
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
