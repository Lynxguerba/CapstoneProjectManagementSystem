<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdviserLiveDefenseController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User|null $adviser */
        $adviser = Auth::guard('web')->user();
        if ($adviser instanceof User) {
            $adviser->loadMissing('eSignature');
        }
        $adviserId = $adviser?->id;
        $assignedGroups = $this->resolveAssignedGroups($adviserId);
        $selectedGroup = $this->resolveSelectedGroup($assignedGroups, $request->query('group'));
        $conceptRequirements = $this->resolveConceptRequirements($selectedGroup?->programSet?->academic_year_id);
        $conceptSubmissions = $this->resolveConceptSubmissions(
            $selectedGroup?->id,
            $conceptRequirements->pluck('id')->values(),
        );
        $approvedConceptSubmissionId = $this->resolveApprovedConceptSubmissionId($selectedGroup, $conceptSubmissions);
        $conceptVerdict = $this->resolveConceptVerdict($selectedGroup, $approvedConceptSubmissionId);
        $panelists = $this->resolvePanelists($selectedGroup);
        $liveDefenseWorkspace = $this->resolveLiveDefenseWorkspace($selectedGroup, $conceptSubmissions, $adviserId);
        $recommendationLetter = $this->resolveLatestRecommendationLetter($selectedGroup);
        $conceptDefenseSchedule = $this->resolveConceptDefenseSchedule($selectedGroup);
        $conceptVerdictMinutesDocument = $this->resolveConceptVerdictMinutesDocument($selectedGroup);
        $hasESignature = $adviser instanceof User && $adviser->eSignature !== null;

        return Inertia::render('Adviser/live-defense', [
            'group' => $selectedGroup ? [
                'id' => $selectedGroup->id,
                'name' => $this->formatGroupName($selectedGroup->name),
                'programSetName' => $this->resolveProgramSetName($selectedGroup),
                'academicYear' => $selectedGroup->programSet?->academicYear?->label ?? $selectedGroup->programSet?->school_year,
                'defenseStatus' => $this->resolveConceptDefenseStatus($selectedGroup->id),
            ] : null,
            'conceptSubmissions' => $conceptSubmissions
                ->map(fn (DocumentSubmission $submission): array => [
                    'id' => $submission->id,
                    'title' => (string) $submission->file_name,
                    'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Concept Paper'),
                    'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                    'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                    'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                    'panelistApprovalStatus' => $this->resolvePanelistApprovalStatus((int) $submission->id, $approvedConceptSubmissionId),
                    'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                ])
                ->values()
                ->all(),
            'conceptVerdict' => $conceptVerdict,
            'participants' => [
                'students' => $this->resolveStudents($selectedGroup),
                'adviser' => $this->resolveAdviser($selectedGroup),
                'panelists' => $panelists,
            ],
            'commentsBySubmission' => $liveDefenseWorkspace['commentsBySubmission'],
            'highlightsBySubmission' => $liveDefenseWorkspace['highlightsBySubmission'],
            'commentHighlightTargets' => $liveDefenseWorkspace['commentHighlightTargets'],
            'recommendationLetter' => $recommendationLetter,
            'conceptDefenseSchedule' => $conceptDefenseSchedule,
            'conceptVerdictMinutes' => $conceptVerdictMinutesDocument,
            'hasESignature' => $hasESignature,
        ]);
    }

    /**
     * @return Collection<int, Group>
     */
    private function resolveAssignedGroups(?int $adviserId): Collection
    {
        if (
            $adviserId === null
            || ! Schema::hasTable('groups')
            || ! Schema::hasTable('group_advisers')
        ) {
            return collect();
        }

        $groupColumns = ['id', 'name', 'program_set_id', 'leader_id'];
        if (Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            $groupColumns[] = 'approved_concept_submission_id';
        }
        if (Schema::hasColumn('groups', 'concept_verdict')) {
            $groupColumns[] = 'concept_verdict';
        }
        if (Schema::hasColumn('groups', 'concept_verdict_by_panelist_id')) {
            $groupColumns[] = 'concept_verdict_by_panelist_id';
        }
        if (Schema::hasColumn('groups', 'concept_verdict_decided_at')) {
            $groupColumns[] = 'concept_verdict_decided_at';
        }

        return Group::query()
            ->with([
                'programSet.academicYear',
                'leader',
                'members',
                'adviserAssignment.adviser',
                'panelAssignments.panelist',
            ])
            ->whereHas('adviserAssignment', fn (Builder $query): Builder => $query->where('adviser_id', $adviserId))
            ->orderBy('name')
            ->get($groupColumns);
    }

    /**
     * @param  Collection<int, Group>  $assignedGroups
     */
    private function resolveSelectedGroup(Collection $assignedGroups, mixed $rawGroupId): ?Group
    {
        if ($assignedGroups->isEmpty()) {
            return null;
        }

        $groupId = is_numeric($rawGroupId) ? (int) $rawGroupId : null;
        if ($groupId !== null) {
            /** @var Group|null $matched */
            $matched = $assignedGroups->first(fn (Group $group): bool => $group->id === $groupId);
            if ($matched instanceof Group) {
                return $matched;
            }
        }

        /** @var Group|null $first */
        $first = $assignedGroups->first();

        return $first;
    }

    /**
     * @return Collection<int, DocumentRequirement>
     */
    private function resolveConceptRequirements(?int $academicYearId): Collection
    {
        if (! Schema::hasTable('document_requirements')) {
            return collect();
        }

        $baseQuery = DocumentRequirement::query()
            ->where('stage', 'Concept')
            ->when(is_int($academicYearId), fn (Builder $query) => $query->where('academic_year_id', $academicYearId))
            ->orderBy('due_date')
            ->orderByDesc('id');

        $keywordMatched = (clone $baseQuery)
            ->whereRaw('LOWER(requirement_type) like ?', ['%concept%'])
            ->get(['id', 'requirement_type', 'due_date', 'academic_year_id', 'stage']);

        if ($keywordMatched->isNotEmpty()) {
            return $keywordMatched;
        }

        return $baseQuery->get(['id', 'requirement_type', 'due_date', 'academic_year_id', 'stage']);
    }

    /**
     * @param  Collection<int, int>  $requirementIds
     * @return Collection<int, DocumentSubmission>
     */
    private function resolveConceptSubmissions(?int $groupId, Collection $requirementIds): Collection
    {
        if (
            $groupId === null
            || $requirementIds->isEmpty()
            || ! Schema::hasTable('document_submissions')
        ) {
            return collect();
        }

        return DocumentSubmission::query()
            ->with('requirement:id,requirement_type')
            ->where('group_id', $groupId)
            ->whereIn('document_requirement_id', $requirementIds->all())
            ->orderByDesc('created_at')
            ->get([
                'id',
                'group_id',
                'document_requirement_id',
                'file_name',
                'file_path',
                'status',
                'adviser_status',
                'created_at',
            ]);
    }

    /**
     * @param  Collection<int, DocumentSubmission>  $conceptSubmissions
     * @return array{
     *     commentsBySubmission: array<int, array<int, array{id: string, databaseId: int, author: string, authorRole: string, attributedPanelistName: string|null, message: string, createdAt: string, canDelete: bool}>>,
     *     highlightsBySubmission: array<int, array<int, array<string, mixed>>>,
     *     commentHighlightTargets: array<string, array{submissionId: int, highlightId: string}>
     * }
     */
    private function resolveLiveDefenseWorkspace(?Group $group, Collection $conceptSubmissions, ?int $adviserId): array
    {
        $commentsBySubmission = [];
        $highlightsBySubmission = [];
        $commentHighlightTargets = [];

        $conceptSubmissions->each(function (DocumentSubmission $submission) use (&$commentsBySubmission, &$highlightsBySubmission): void {
            $commentsBySubmission[(int) $submission->id] = [];
            $highlightsBySubmission[(int) $submission->id] = [];
        });

        if (
            ! $group instanceof Group
            || $conceptSubmissions->isEmpty()
            || ! Schema::hasTable('live_defense_comments')
            || ! Schema::hasTable('live_defense_comment_highlights')
        ) {
            return [
                'commentsBySubmission' => $commentsBySubmission,
                'highlightsBySubmission' => $highlightsBySubmission,
                'commentHighlightTargets' => $commentHighlightTargets,
            ];
        }

        $submissionIds = $conceptSubmissions
            ->map(fn (DocumentSubmission $submission): int => (int) $submission->id)
            ->values();

        $hasReferencedPanelistColumn = Schema::hasColumn('live_defense_comments', 'referenced_panelist_id');
        $commentRelations = [
            'author:id,name,first_name,last_name,email',
            'highlight:id,live_defense_comment_id,highlight_id,quote_text,comment_emoji,content,position',
        ];
        if ($hasReferencedPanelistColumn) {
            $commentRelations[] = 'referencedPanelist:id,name,first_name,last_name,email';
        }

        $commentColumns = [
            'id',
            'group_id',
            'document_submission_id',
            'author_id',
            'author_role',
            'message',
            'is_highlight_comment',
            'created_at',
        ];
        if ($hasReferencedPanelistColumn) {
            $commentColumns[] = 'referenced_panelist_id';
        }

        $comments = LiveDefenseComment::query()
            ->with($commentRelations)
            ->where('group_id', $group->id)
            ->whereIn('document_submission_id', $submissionIds->all())
            ->orderBy('created_at')
            ->orderBy('id')
            ->get($commentColumns);

        foreach ($comments as $comment) {
            $submissionId = (int) $comment->document_submission_id;
            if (! array_key_exists($submissionId, $commentsBySubmission)) {
                $commentsBySubmission[$submissionId] = [];
                $highlightsBySubmission[$submissionId] = [];
            }

            $commentId = 'c-'.$comment->id;
            $highlight = $comment->highlight;
            $highlightPrefix = $highlight !== null
                ? $this->buildHighlightedQuotePrefix($highlight->quote_text)
                : '';
            $authorName = $comment->author instanceof User
                ? $this->resolveUserName($comment->author)
                : (string) $comment->author_role;

            $commentsBySubmission[$submissionId][] = [
                'id' => $commentId,
                'databaseId' => (int) $comment->id,
                'author' => $authorName !== '' ? $authorName : (string) $comment->author_role,
                'authorRole' => (string) $comment->author_role,
                'attributedPanelistName' => $hasReferencedPanelistColumn
                    ? $this->resolveOptionalUserName($comment->referencedPanelist)
                    : null,
                'message' => $highlightPrefix.(string) $comment->message,
                'createdAt' => $comment->created_at?->toIso8601String() ?? '',
                'canDelete' => (int) ($comment->author_id ?? 0) === (int) ($adviserId ?? 0),
            ];

            if ($highlight === null) {
                continue;
            }

            $highlightId = trim((string) $highlight->highlight_id);
            $position = is_array($highlight->position) ? $highlight->position : null;

            if ($highlightId === '' || $position === null) {
                continue;
            }

            $highlightsBySubmission[$submissionId][] = [
                'id' => $highlightId,
                'content' => $this->resolveHighlightContent($highlight->content, $highlight->quote_text),
                'position' => $position,
                'comment' => [
                    'text' => (string) $comment->message,
                    'emoji' => $this->resolveHighlightEmoji($highlight->comment_emoji),
                ],
            ];

            $commentHighlightTargets[$commentId] = [
                'submissionId' => $submissionId,
                'highlightId' => $highlightId,
            ];
        }

        return [
            'commentsBySubmission' => $commentsBySubmission,
            'highlightsBySubmission' => $highlightsBySubmission,
            'commentHighlightTargets' => $commentHighlightTargets,
        ];
    }

    private function buildHighlightedQuotePrefix(?string $quoteText): string
    {
        $trimmedQuote = is_string($quoteText) ? trim($quoteText) : '';
        if ($trimmedQuote === '') {
            return '';
        }

        return '"'.Str::limit($trimmedQuote, 80, '…').'" — ';
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveHighlightContent(mixed $content, ?string $quoteText): array
    {
        if (is_array($content)) {
            return $content;
        }

        $trimmedQuote = is_string($quoteText) ? trim($quoteText) : '';

        return [
            'text' => $trimmedQuote,
        ];
    }

    private function resolveHighlightEmoji(?string $emoji): string
    {
        $trimmedEmoji = is_string($emoji) ? trim($emoji) : '';

        return $trimmedEmoji !== '' ? $trimmedEmoji : '💬';
    }

    /**
     * @param  Collection<int, DocumentSubmission>  $conceptSubmissions
     */
    private function resolveApprovedConceptSubmissionId(?Group $group, Collection $conceptSubmissions): ?int
    {
        if (! $group instanceof Group || ! Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            return null;
        }

        $approvedConceptSubmissionId = is_numeric($group->approved_concept_submission_id)
            ? (int) $group->approved_concept_submission_id
            : null;

        if ($approvedConceptSubmissionId === null) {
            return null;
        }

        $isApprovedSubmissionStillAvailable = $conceptSubmissions
            ->contains(fn (DocumentSubmission $submission): bool => (int) $submission->id === $approvedConceptSubmissionId);

        return $isApprovedSubmissionStillAvailable ? $approvedConceptSubmissionId : null;
    }

    private function resolvePanelistApprovalStatus(int $submissionId, ?int $approvedConceptSubmissionId): string
    {
        if ($approvedConceptSubmissionId === null) {
            return 'Pending';
        }

        return $approvedConceptSubmissionId === $submissionId ? 'Approved' : 'Rejected';
    }

    /**
     * @return array{
     *     value: string|null,
     *     approvedConceptSubmissionId: int|null,
     *     decidedAt: string|null,
     *     decidedBy: string|null
     * }|null
     */
    private function resolveConceptVerdict(?Group $group, ?int $approvedConceptSubmissionId): ?array
    {
        if (
            ! $group instanceof Group
            || ! Schema::hasColumn('groups', 'concept_verdict')
            || ! Schema::hasColumn('groups', 'concept_verdict_by_panelist_id')
            || ! Schema::hasColumn('groups', 'concept_verdict_decided_at')
        ) {
            return null;
        }

        $verdict = is_string($group->concept_verdict) ? trim($group->concept_verdict) : '';
        $decidedByPanelistId = is_numeric($group->concept_verdict_by_panelist_id)
            ? (int) $group->concept_verdict_by_panelist_id
            : null;
        $decidedBy = null;

        if ($decidedByPanelistId !== null) {
            $panelAssignment = $group->panelAssignments
                ->first(fn (GroupPanelist $assignment): bool => (int) $assignment->panelist_id === $decidedByPanelistId);

            if ($panelAssignment instanceof GroupPanelist) {
                $decidedBy = $this->resolveUserName($panelAssignment->panelist);
            } else {
                $decidedBy = $this->resolveUserName(
                    User::query()->whereKey($decidedByPanelistId)->first(['id', 'name', 'first_name', 'last_name', 'email'])
                );
            }
        }

        return [
            'value' => $verdict !== '' ? $verdict : null,
            'approvedConceptSubmissionId' => $approvedConceptSubmissionId,
            'decidedAt' => $group->concept_verdict_decided_at?->format('Y-m-d H:i'),
            'decidedBy' => $decidedBy,
        ];
    }

    /**
     * @return array{id: int, fileName: string, fileUrl: string|null, signedAt: string|null, adviserName: string|null}|null
     */
    private function resolveLatestRecommendationLetter(?Group $group): ?array
    {
        if (! $group instanceof Group || ! Schema::hasTable('adviser_recommendation_documents')) {
            return null;
        }

        $latestRecommendation = AdviserRecommendationDocument::query()
            ->with('adviser:id,name,first_name,last_name,email')
            ->where('group_id', $group->id)
            ->orderByDesc('signed_at')
            ->orderByDesc('id')
            ->first([
                'id',
                'adviser_id',
                'file_name',
                'file_path',
                'signed_at',
            ]);

        if (! $latestRecommendation instanceof AdviserRecommendationDocument) {
            return null;
        }

        $filePath = is_string($latestRecommendation->file_path) ? trim($latestRecommendation->file_path) : '';
        $fileUrl = $filePath !== '' ? Storage::disk('public')->url($filePath) : null;

        return [
            'id' => $latestRecommendation->id,
            'fileName' => (string) $latestRecommendation->file_name,
            'fileUrl' => $fileUrl,
            'signedAt' => $latestRecommendation->signed_at?->format('Y-m-d H:i'),
            'adviserName' => $this->resolveUserName($latestRecommendation->adviser),
        ];
    }

    /**
     * @return array{scheduledDate: string|null, startTime: string|null, endTime: string|null}|null
     */
    private function resolveConceptDefenseSchedule(?Group $group): ?array
    {
        if (! $group instanceof Group || ! Schema::hasTable('defense_schedules')) {
            return null;
        }

        $schedule = DefenseSchedule::query()
            ->where('group_id', $group->id)
            ->where('stage', 'Concept')
            ->orderByDesc('scheduled_date')
            ->orderByDesc('start_time')
            ->orderByDesc('id')
            ->first([
                'id',
                'scheduled_date',
                'start_time',
                'end_time',
            ]);

        if (! $schedule instanceof DefenseSchedule) {
            return null;
        }

        $startTime = is_string($schedule->start_time) ? trim($schedule->start_time) : '';
        $endTime = is_string($schedule->end_time) ? trim($schedule->end_time) : '';

        return [
            'scheduledDate' => $schedule->scheduled_date?->format('Y-m-d'),
            'startTime' => $startTime !== '' ? $startTime : null,
            'endTime' => $endTime !== '' ? $endTime : null,
        ];
    }

    /**
     * @return array{fileName: string, fileUrl: string, signedAt: string|null}|null
     */
    private function resolveConceptVerdictMinutesDocument(?Group $group): ?array
    {
        if (! $group instanceof Group) {
            return null;
        }

        $disk = Storage::disk('public');
        $directory = "concept-verdict-minutes/group-{$group->id}";

        try {
            $files = collect($disk->files($directory))
                ->filter(fn (string $path): bool => str_ends_with(strtolower($path), '.pdf'))
                ->values();
        } catch (Throwable) {
            return null;
        }

        if ($files->isEmpty()) {
            return null;
        }

        $latestPath = $files
            ->sortByDesc(fn (string $path): int => (int) $disk->lastModified($path))
            ->first();

        if (! is_string($latestPath) || trim($latestPath) === '') {
            return null;
        }

        $lastModifiedTimestamp = (int) $disk->lastModified($latestPath);
        $signedAt = $lastModifiedTimestamp > 0
            ? Carbon::createFromTimestamp($lastModifiedTimestamp)->format('Y-m-d H:i')
            : null;

        return [
            'fileName' => basename($latestPath),
            'fileUrl' => $disk->url($latestPath),
            'signedAt' => $signedAt,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, role: string, email: string|null}>
     */
    private function resolveStudents(?Group $group): array
    {
        if (! $group instanceof Group) {
            return [];
        }

        $students = collect();
        if ($group->leader instanceof User) {
            $students->push([
                'id' => $group->leader->id,
                'name' => $this->resolveUserName($group->leader),
                'role' => 'Leader',
                'email' => $group->leader->email,
            ]);
        }

        $students = $students->merge(
            $group->members
                ->map(fn (User $member): array => [
                    'id' => $member->id,
                    'name' => $this->resolveUserName($member),
                    'role' => 'Member',
                    'email' => $member->email,
                ]),
        );

        return $students
            ->unique('id')
            ->values()
            ->all();
    }

    /**
     * @return array{id: int, name: string, role: string, email: string|null}|null
     */
    private function resolveAdviser(?Group $group): ?array
    {
        $adviser = $group?->adviserAssignment?->adviser;
        if (! $adviser instanceof User) {
            return null;
        }

        return [
            'id' => $adviser->id,
            'name' => $this->resolveUserName($adviser),
            'role' => 'Adviser',
            'email' => $adviser->email,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, role: string, email: string|null}>
     */
    private function resolvePanelists(?Group $group): array
    {
        if (! $group instanceof Group) {
            return [];
        }

        return $group->panelAssignments
            ->sortBy('panel_slot')
            ->values()
            ->map(function (GroupPanelist $assignment): array {
                $panelist = $assignment->panelist;
                $normalizedRole = is_string($assignment->role) ? strtolower(trim($assignment->role)) : '';
                $isChairman = $normalizedRole === 'chairman' || (int) ($assignment->panel_slot ?? 0) === 1;

                return [
                    'id' => (int) $assignment->panelist_id,
                    'name' => $this->resolveUserName($panelist),
                    'role' => $isChairman ? 'Panel Chairman' : 'Panel Member',
                    'email' => $panelist?->email,
                ];
            })
            ->all();
    }

    private function resolveConceptDefenseStatus(int $groupId): string
    {
        if (! Schema::hasTable('defense_schedules')) {
            return 'Pending';
        }

        $conceptSchedule = DefenseSchedule::query()
            ->where('group_id', $groupId)
            ->where('stage', 'Concept')
            ->orderByDesc('scheduled_date')
            ->first(['id', 'status']);

        $status = is_string($conceptSchedule?->status) ? trim($conceptSchedule->status) : '';
        if ($status === 'Completed') {
            return 'Completed';
        }

        if ($status === 'Scheduled') {
            return 'In Progress';
        }

        return 'Pending';
    }

    private function resolveProgramSetName(Group $group): string
    {
        $programSetName = is_string($group->programSet?->name) ? trim($group->programSet->name) : '';
        if ($programSetName !== '') {
            return $programSetName;
        }

        $program = is_string($group->programSet?->program) ? trim($group->programSet->program) : '';
        $schoolYear = is_string($group->programSet?->school_year) ? trim($group->programSet->school_year) : '';
        $fallback = trim($program.' '.$schoolYear);

        return $fallback !== '' ? $fallback : 'Program set';
    }

    private function formatGroupName(string $name): string
    {
        $trimmed = trim($name);
        if ($trimmed === '') {
            return 'Group';
        }

        return str_ends_with(strtolower($trimmed), ' group') ? $trimmed : $trimmed.' Group';
    }

    private function resolveUserName(?User $user): string
    {
        if (! $user instanceof User) {
            return 'Unassigned';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);
        if ($fullName !== '') {
            return $fullName;
        }

        $name = is_string($user->name) ? trim($user->name) : '';
        if ($name !== '') {
            return $name;
        }

        return $user->email ?? 'Unassigned';
    }

    private function resolveOptionalUserName(?User $user): ?string
    {
        if (! $user instanceof User) {
            return null;
        }

        return $this->resolveUserName($user);
    }
}
