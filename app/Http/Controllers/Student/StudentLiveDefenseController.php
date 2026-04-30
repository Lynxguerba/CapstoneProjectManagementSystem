<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupDefenseVerdict;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentLiveDefenseController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $activeStage = $this->resolveRequestedStage($request->query('stage'));
        $panelists = $this->resolveGroupPanelists($group);
        $conceptSubmissions = $this->resolveStageSubmissions($group, $activeStage);
        $recommendationLetter = $this->resolveLatestRecommendationLetter($group, $activeStage);
        $approvedConceptSubmissionId = $this->resolveApprovedConceptSubmissionId($group, $conceptSubmissions);
        $conceptVerdict = $this->resolveStageVerdict($group, $conceptSubmissions, $approvedConceptSubmissionId, $activeStage);
        $liveDefenseWorkspace = $this->resolveLiveDefenseWorkspace($group, $conceptSubmissions);
        $isOutlineStage = $this->isOutlineStage($activeStage);

        return Inertia::render('Student/live-defense', [
            'activeStage' => $activeStage,
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
                'defenseStatus' => $this->resolveStageDefenseStatus($group->id, $activeStage),
            ] : null,
            'conceptSubmissions' => $conceptSubmissions
                ->map(function (DocumentSubmission $submission) use ($approvedConceptSubmissionId, $isOutlineStage): array {
                    $reviewStatus = $isOutlineStage
                        ? (string) ($submission->adviser_status ?? 'Submitted')
                        : $this->resolvePanelistApprovalStatus((int) $submission->id, $approvedConceptSubmissionId);

                    return [
                        'id' => $submission->id,
                        'title' => (string) $submission->file_name,
                        'requirementType' => (string) ($submission->requirement?->requirement_type ?? ($isOutlineStage ? 'Manuscript' : 'Concept Paper')),
                        'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                        'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                        'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                        'panelistApprovalStatus' => $reviewStatus,
                        'reviewStatus' => $reviewStatus,
                        'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                    ];
                })
                ->values()
                ->all(),
            'panelists' => $panelists,
            'participants' => [
                'students' => $this->resolveStudents($group),
                'adviser' => $this->resolveAdviser($group),
                'panelists' => $this->resolveParticipantPanelists($group),
            ],
            'commentsBySubmission' => $liveDefenseWorkspace['commentsBySubmission'],
            'highlightsBySubmission' => $liveDefenseWorkspace['highlightsBySubmission'],
            'commentHighlightTargets' => $liveDefenseWorkspace['commentHighlightTargets'],
            'recommendationLetter' => $recommendationLetter,
            'conceptVerdict' => $conceptVerdict,
        ]);
    }

    private function resolveRequestedStage(mixed $value): string
    {
        if (! is_string($value)) {
            return 'Concept';
        }

        $normalizedStage = trim($value);

        return $normalizedStage !== '' ? $normalizedStage : 'Concept';
    }

    private function isOutlineStage(string $stage): bool
    {
        return strtolower(trim($stage)) === 'outline';
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');
        $hasProgramSetsTable = Schema::hasTable('program_sets');
        $hasAcademicYearsTable = Schema::hasTable('academic_years');
        $hasGroupAdvisersTable = Schema::hasTable('group_advisers');
        $hasGroupPanelistsTable = Schema::hasTable('group_panelists');
        $hasUsersTable = Schema::hasTable('users');

        $query = Group::query();

        if ($hasProgramSetsTable) {
            $query->with('programSet:id,name,academic_year_id');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear:id,label');
            }
        }

        if ($hasUsersTable) {
            $query->with('leader:id,name,first_name,last_name,email');
        }

        if ($hasGroupMembersTable && $hasUsersTable) {
            $query->with('members:id,name,first_name,last_name,email');
        }

        if ($hasGroupAdvisersTable && $hasUsersTable) {
            $query->with('adviserAssignment.adviser:id,name,first_name,last_name,email');
        }

        if ($hasGroupPanelistsTable && $hasUsersTable) {
            $query->with([
                'panelAssignments' => function (HasMany $assignmentQuery): void {
                    $assignmentQuery
                        ->with('panelist:id,name,first_name,last_name,email')
                        ->orderBy('panel_slot');
                },
            ]);
        }

        $query->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
            $groupQuery->where('leader_id', $studentId);

            if ($hasGroupMembersTable) {
                $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                    $memberQuery->where('users.id', $studentId);
                });
            }
        });

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

        return $query->first($groupColumns);
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
        if ($groupId === null || $requirementIds->isEmpty() || ! Schema::hasTable('document_submissions')) {
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
     * @return Collection<int, DocumentRequirement>
     */
    private function resolveOutlineManuscriptRequirements(?int $academicYearId): Collection
    {
        if (! Schema::hasTable('document_requirements')) {
            return collect();
        }

        $requirementsQuery = DocumentRequirement::query()
            ->where('stage', 'Outline')
            ->when(
                is_int($academicYearId),
                fn (Builder $query) => $query->where(function (Builder $nestedQuery) use ($academicYearId): void {
                    $nestedQuery->where('academic_year_id', $academicYearId)
                        ->orWhereNull('academic_year_id');
                }),
            )
            ->orderBy('due_date')
            ->orderBy('id');

        return $requirementsQuery
            ->get(['id', 'requirement_type', 'due_date', 'academic_year_id', 'stage'])
            ->filter(fn (DocumentRequirement $requirement): bool => $this->isOutlineManuscriptRequirementType($requirement->requirement_type))
            ->values();
    }

    /**
     * @param  Collection<int, int>  $requirementIds
     * @return Collection<int, DocumentSubmission>
     */
    private function resolveOutlineManuscriptSubmissions(?int $groupId, Collection $requirementIds): Collection
    {
        if ($groupId === null || $requirementIds->isEmpty() || ! Schema::hasTable('document_submissions')) {
            return collect();
        }

        return DocumentSubmission::query()
            ->with('requirement:id,requirement_type,stage')
            ->where('group_id', $groupId)
            ->whereIn('document_requirement_id', $requirementIds->all())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
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
     * @return Collection<int, DocumentSubmission>
     */
    private function resolveStageSubmissions(?Group $group, string $activeStage): Collection
    {
        $academicYearId = $group?->programSet?->academic_year_id;

        if ($this->isOutlineStage($activeStage)) {
            $outlineRequirements = $this->resolveOutlineManuscriptRequirements($academicYearId);

            return $this->resolveOutlineManuscriptSubmissions(
                $group?->id,
                $outlineRequirements->pluck('id')->values(),
            );
        }

        $conceptRequirements = $this->resolveConceptRequirements($academicYearId);

        return $this->resolveConceptSubmissions(
            $group?->id,
            $conceptRequirements->pluck('id')->values(),
        );
    }

    /**
     * @return array<int, array{id: int, name: string, email: string|null, slot: int|null, role: string|null}>
     */
    private function resolveGroupPanelists(?Group $group): array
    {
        if (! $group instanceof Group || ! $group->relationLoaded('panelAssignments')) {
            return [];
        }

        return $group->panelAssignments
            ->sortBy('panel_slot')
            ->values()
            ->map(function (GroupPanelist $assignment): array {
                $panelist = $assignment->panelist;

                return [
                    'id' => (int) $assignment->panelist_id,
                    'name' => $this->resolveUserName($panelist),
                    'email' => $panelist?->email ?? null,
                    'slot' => $assignment->panel_slot !== null ? (int) $assignment->panel_slot : null,
                    'role' => $assignment->role !== null ? (string) $assignment->role : null,
                ];
            })
            ->all();
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
                'id' => (int) $group->leader->id,
                'name' => $this->resolveUserName($group->leader),
                'role' => 'Leader',
                'email' => $group->leader->email,
            ]);
        }

        $students = $students->merge(
            $group->members
                ->map(fn (User $member): array => [
                    'id' => (int) $member->id,
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
            'id' => (int) $adviser->id,
            'name' => $this->resolveUserName($adviser),
            'role' => 'Adviser',
            'email' => $adviser->email,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, role: string, email: string|null}>
     */
    private function resolveParticipantPanelists(?Group $group): array
    {
        if (! $group instanceof Group || ! $group->relationLoaded('panelAssignments')) {
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
                    'email' => $panelist?->email ?? null,
                ];
            })
            ->all();
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
     * @param  Collection<int, DocumentSubmission>  $documentSubmissions
     * @return array{
     *     value: string|null,
     *     approvedConceptSubmissionId: int|null,
     *     decidedAt: string|null,
     *     decidedBy: string|null
     * }|null
     */
    private function resolveStageVerdict(
        ?Group $group,
        Collection $documentSubmissions,
        ?int $approvedConceptSubmissionId,
        string $activeStage,
    ): ?array {
        if (! $this->isOutlineStage($activeStage)) {
            return $this->resolveConceptVerdict($group, $approvedConceptSubmissionId);
        }

        if (! $group instanceof Group || ! Schema::hasTable('group_defense_verdicts')) {
            return null;
        }

        $stageVerdict = GroupDefenseVerdict::query()
            ->with('panelist:id,name,first_name,last_name,email')
            ->where('group_id', $group->id)
            ->where('stage', $activeStage)
            ->first([
                'id',
                'group_id',
                'stage',
                'verdict',
                'approved_document_submission_id',
                'panelist_user_id',
                'decided_at',
            ]);

        if (! $stageVerdict instanceof GroupDefenseVerdict) {
            return null;
        }

        $approvedSubmissionId = is_numeric($stageVerdict->approved_document_submission_id)
            ? (int) $stageVerdict->approved_document_submission_id
            : null;

        if (
            $approvedSubmissionId !== null
            && ! $documentSubmissions->contains(
                fn (DocumentSubmission $submission): bool => (int) $submission->id === $approvedSubmissionId
            )
        ) {
            $approvedSubmissionId = null;
        }

        $verdict = trim((string) $stageVerdict->verdict);

        return [
            'value' => $verdict !== '' ? $verdict : null,
            'approvedConceptSubmissionId' => $approvedSubmissionId,
            'decidedAt' => $stageVerdict->decided_at?->format('Y-m-d H:i'),
            'decidedBy' => $this->resolveOptionalUserName($stageVerdict->panelist),
        ];
    }

    /**
     * @param  Collection<int, DocumentSubmission>  $conceptSubmissions
     * @return array{
     *     commentsBySubmission: array<int, array<int, array{id: string, databaseId: int, author: string, authorRole: string, attributedPanelistName: string|null, message: string, createdAt: string, canDelete: bool}>>,
     *     highlightsBySubmission: array<int, array<int, array<string, mixed>>>,
     *     commentHighlightTargets: array<string, array{submissionId: int, highlightId: string}>
     * }
     */
    private function resolveLiveDefenseWorkspace(?Group $group, Collection $conceptSubmissions): array
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
                'canDelete' => false,
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

    private function resolveStageDefenseStatus(int $groupId, string $activeStage): string
    {
        if (! Schema::hasTable('defense_schedules')) {
            return 'Pending';
        }

        $status = DefenseSchedule::query()
            ->where('group_id', $groupId)
            ->whereRaw('LOWER(stage) = ?', [strtolower(trim($activeStage))])
            ->value('status');

        return is_string($status) && $status !== '' ? $status : 'Pending';
    }

    /**
     * @return array{id: int, fileName: string, fileUrl: string|null, signedAt: string|null, adviserName: string|null}|null
     */
    private function resolveLatestRecommendationLetter(?Group $group, string $activeStage): ?array
    {
        if (! $group instanceof Group || ! Schema::hasTable('adviser_recommendation_documents')) {
            return null;
        }

        $latestRecommendation = AdviserRecommendationDocument::query()
            ->with([
                'adviser:id,name,first_name,last_name,email',
                'requirement:id,stage',
            ])
            ->where('group_id', $group->id)
            ->whereHas('requirement', fn ($query) => $query->where('stage', $activeStage))
            ->orderByDesc('signed_at')
            ->orderByDesc('id')
            ->first([
                'id',
                'adviser_id',
                'document_requirement_id',
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

    private function isOutlineManuscriptRequirementType(?string $requirementType): bool
    {
        $normalizedRequirementType = strtolower(trim((string) $requirementType));

        return str_contains($normalizedRequirementType, 'manuscript')
            || str_contains($normalizedRequirementType, 'project outline')
            || $normalizedRequirementType === 'outline';
    }

    private function resolveUserName(?User $user): string
    {
        if (! $user instanceof User) {
            return 'Unassigned panelist';
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

        return $user->email ?? 'Unassigned panelist';
    }

    private function resolveOptionalUserName(?User $user): ?string
    {
        if (! $user instanceof User) {
            return null;
        }

        return $this->resolveUserName($user);
    }
}
