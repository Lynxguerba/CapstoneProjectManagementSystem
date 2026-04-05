<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\DefenseSchedule;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use App\Models\User;
use App\Services\AdviserConceptVerdictMinutesPdfGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class GenerateAdviserConceptVerdictMinutesController extends Controller
{
    public function __invoke(
        Request $request,
        Group $group,
        AdviserConceptVerdictMinutesPdfGenerator $pdfGenerator
    ): JsonResponse {
        $adviser = $request->user();
        if (! $adviser instanceof User || ! $adviser->hasRole('adviser')) {
            return response()->json([
                'message' => 'Only advisers can generate concept verdict minutes.',
            ], 403);
        }

        $group->loadMissing([
            'leader:id,name,first_name,last_name,email',
            'members:id,name,first_name,last_name,email',
            'adviserAssignment:group_id,adviser_id',
            'panelAssignments.panelist:id,name,first_name,last_name,email',
            'approvedConceptSubmission:id,file_name',
        ]);

        if ((int) ($group->adviserAssignment?->adviser_id ?? 0) !== (int) $adviser->id) {
            return response()->json([
                'message' => 'You are not assigned to this group.',
            ], 403);
        }

        if (
            ! Schema::hasColumn('groups', 'concept_verdict')
            || ! Schema::hasColumn('groups', 'approved_concept_submission_id')
        ) {
            return response()->json([
                'message' => 'Concept verdict data is not available yet. Please run migrations first.',
            ], 422);
        }

        $verdict = is_string($group->concept_verdict) ? trim($group->concept_verdict) : '';
        if ($verdict === '') {
            return response()->json([
                'message' => 'Set the concept verdict first before generating minutes.',
            ], 422);
        }

        $adviser->loadMissing('eSignature');
        $signatureData = (string) ($adviser->eSignature?->signature_data ?? '');
        if ($signatureData === '') {
            return response()->json([
                'message' => 'Register your e-signature in Adviser Settings before generating minutes.',
            ], 422);
        }

        $conceptSchedule = $this->resolveConceptSchedule($group->id);
        $defenseDate = $conceptSchedule?->scheduled_date?->format('F d, Y') ?? now()->format('F d, Y');
        $timeStarted = $this->formatScheduleTime($conceptSchedule?->start_time);
        $timeEnded = $this->formatScheduleTime($conceptSchedule?->end_time);

        $proponentNames = $this->resolveProponentNames($group);
        $panelAssignments = $group->panelAssignments->sortBy('panel_slot')->values();
        $chairmanName = $this->resolveChairmanName($panelAssignments);
        $memberPanelistNames = $this->resolveMemberPanelistNames($panelAssignments);
        $commentsByPanelist = $this->resolveCommentsByPanelist($group, $panelAssignments);
        $approvedTitle = $this->resolveApprovedTitleForVerdict($group, $verdict);
        $adviserName = $this->resolveUserName($adviser);
        $signedAt = now();

        try {
            $generatedPdfPath = $pdfGenerator->generate(
                $signatureData,
                $adviserName,
                $signedAt,
                $defenseDate,
                $timeStarted,
                $timeEnded,
                $proponentNames,
                $chairmanName,
                $memberPanelistNames,
                $commentsByPanelist,
                $verdict,
                $approvedTitle,
            );
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to generate concept verdict minutes PDF. '.$exception->getMessage(),
            ], 500);
        }

        $groupName = is_string($group->name) ? trim($group->name) : '';
        $fileName = Str::slug($groupName !== '' ? $groupName : 'group').'-concept-verdict-minutes.pdf';
        $relativePath = "concept-verdict-minutes/group-{$group->id}/{$fileName}";
        $disk = Storage::disk('public');
        $disk->put($relativePath, File::get($generatedPdfPath));
        File::deleteDirectory(dirname($generatedPdfPath));

        return response()->json([
            'message' => 'Concept verdict minutes generated successfully.',
            'minutes_document' => [
                'file_name' => $fileName,
                'file_url' => $disk->url($relativePath),
                'signed_at' => $signedAt->format('Y-m-d H:i'),
                'verdict' => $verdict,
                'approved_title' => $approvedTitle,
            ],
        ]);
    }

    private function resolveConceptSchedule(int $groupId): ?DefenseSchedule
    {
        if (! Schema::hasTable('defense_schedules')) {
            return null;
        }

        return DefenseSchedule::query()
            ->where('group_id', $groupId)
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
    }

    private function formatScheduleTime(mixed $rawTime): string
    {
        $normalized = is_string($rawTime) ? trim($rawTime) : '';
        if ($normalized === '') {
            return '—';
        }

        $segments = explode(':', $normalized);
        if (count($segments) < 2) {
            return $normalized;
        }

        $hours = is_numeric($segments[0]) ? (int) $segments[0] : null;
        $minutes = is_numeric($segments[1]) ? (int) $segments[1] : null;
        if ($hours === null || $minutes === null) {
            return $normalized;
        }

        $normalizedHour = $hours % 12;
        if ($normalizedHour === 0) {
            $normalizedHour = 12;
        }

        $suffix = $hours >= 12 ? 'PM' : 'AM';

        return sprintf('%d:%02d %s', $normalizedHour, $minutes, $suffix);
    }

    /**
     * @return array<int, string>
     */
    private function resolveProponentNames(Group $group): array
    {
        return collect([$group->leader, ...$group->members->all()])
            ->filter(fn (?User $user): bool => $user instanceof User)
            ->unique(fn (User $user): int => (int) $user->id)
            ->sortBy(fn (User $user): string => $this->resolveSortableLastName($user).'|'.$this->resolveUserName($user))
            ->map(fn (User $user): string => $this->resolveUserName($user))
            ->filter(fn (string $name): bool => $name !== '')
            ->values()
            ->all();
    }

    private function resolveChairmanName(Collection $panelAssignments): ?string
    {
        /** @var GroupPanelist|null $chairmanAssignment */
        $chairmanAssignment = $panelAssignments->first(
            fn (GroupPanelist $assignment): bool => $this->isChairmanAssignment($assignment)
        );

        if ($chairmanAssignment instanceof GroupPanelist) {
            $chairmanName = $this->resolveUserName($chairmanAssignment->panelist);

            return $chairmanName !== '' ? $chairmanName : null;
        }

        /** @var GroupPanelist|null $fallback */
        $fallback = $panelAssignments->first();
        if (! $fallback instanceof GroupPanelist) {
            return null;
        }

        $fallbackName = $this->resolveUserName($fallback->panelist);

        return $fallbackName !== '' ? $fallbackName : null;
    }

    /**
     * @param  Collection<int, GroupPanelist>  $panelAssignments
     * @return array<int, string>
     */
    private function resolveMemberPanelistNames(Collection $panelAssignments): array
    {
        return $panelAssignments
            ->filter(fn (GroupPanelist $assignment): bool => ! $this->isChairmanAssignment($assignment))
            ->map(fn (GroupPanelist $assignment): string => $this->resolveUserName($assignment->panelist))
            ->filter(fn (string $name): bool => $name !== '')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, GroupPanelist>  $panelAssignments
     * @return array<int, array{panelist: string, comments: array<int, string>}>
     */
    private function resolveCommentsByPanelist(Group $group, Collection $panelAssignments): array
    {
        $panelistNameById = $panelAssignments
            ->mapWithKeys(function (GroupPanelist $assignment): array {
                $panelistId = (int) $assignment->panelist_id;
                if ($panelistId <= 0) {
                    return [];
                }

                return [$panelistId => $this->resolveUserName($assignment->panelist)];
            })
            ->filter(fn (string $name): bool => $name !== '');

        if ($panelistNameById->isEmpty()) {
            return [];
        }

        $commentsMap = $panelistNameById
            ->keys()
            ->mapWithKeys(fn (int $panelistId): array => [$panelistId => []])
            ->all();

        if (! Schema::hasTable('live_defense_comments')) {
            return $panelistNameById
                ->map(fn (string $name): array => [
                    'panelist' => $name,
                    'comments' => [],
                ])
                ->values()
                ->all();
        }

        $hasReferencedPanelistColumn = Schema::hasColumn('live_defense_comments', 'referenced_panelist_id');
        $commentColumns = [
            'id',
            'group_id',
            'author_id',
            'author_role',
            'message',
            'created_at',
        ];

        if ($hasReferencedPanelistColumn) {
            $commentColumns[] = 'referenced_panelist_id';
        }

        $comments = LiveDefenseComment::query()
            ->where('group_id', $group->id)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get($commentColumns);

        foreach ($comments as $comment) {
            $message = trim((string) $comment->message);
            if ($message === '') {
                continue;
            }

            $authorRole = strtolower(trim((string) $comment->author_role));
            $normalizedMessage = $this->normalizeCommentMessage($message);

            if ($authorRole === 'panelist') {
                $panelistId = is_numeric($comment->author_id) ? (int) $comment->author_id : null;
                if ($panelistId !== null && array_key_exists($panelistId, $commentsMap)) {
                    $commentsMap[$panelistId][] = $normalizedMessage;
                }

                continue;
            }

            if (! $hasReferencedPanelistColumn || $authorRole !== 'adviser') {
                continue;
            }

            $referencedPanelistId = is_numeric($comment->referenced_panelist_id)
                ? (int) $comment->referenced_panelist_id
                : null;

            if ($referencedPanelistId === null || ! array_key_exists($referencedPanelistId, $commentsMap)) {
                continue;
            }

            $commentsMap[$referencedPanelistId][] = $normalizedMessage;
        }

        return $panelistNameById
            ->map(function (string $name, int $panelistId) use ($commentsMap): array {
                $comments = collect($commentsMap[$panelistId] ?? [])
                    ->map(fn (string $comment): string => trim($comment))
                    ->filter(fn (string $comment): bool => $comment !== '')
                    ->values()
                    ->all();

                return [
                    'panelist' => $name,
                    'comments' => $comments,
                ];
            })
            ->values()
            ->all();
    }

    private function resolveApprovedTitleForVerdict(Group $group, string $verdict): ?string
    {
        $normalizedVerdict = strtolower(trim($verdict));
        $usesApprovedTitle = in_array($normalizedVerdict, ['pass with revision', 'conditional pass'], true);
        if (! $usesApprovedTitle) {
            return null;
        }

        $approvedTitle = trim((string) ($group->approvedConceptSubmission?->file_name ?? ''));

        return $approvedTitle !== '' ? $approvedTitle : null;
    }

    private function isChairmanAssignment(GroupPanelist $assignment): bool
    {
        $normalizedRole = strtolower(trim((string) ($assignment->role ?? '')));

        return $normalizedRole === 'chairman' || (int) ($assignment->panel_slot ?? 0) === 1;
    }

    private function normalizeCommentMessage(string $message): string
    {
        return trim(preg_replace('/\s+/', ' ', $message) ?? '');
    }

    private function resolveSortableLastName(User $user): string
    {
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        if ($lastName !== '') {
            return strtolower($lastName);
        }

        $displayName = $this->resolveUserName($user);
        if ($displayName === '') {
            return '';
        }

        $segments = preg_split('/\s+/', $displayName) ?: [];
        if ($segments === []) {
            return strtolower($displayName);
        }

        $lastSegment = (string) ($segments[count($segments) - 1] ?? '');

        return strtolower(trim($lastSegment));
    }

    private function resolveUserName(?User $user): string
    {
        if (! $user instanceof User) {
            return '';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        $fallbackName = is_string($user->name) ? trim($user->name) : '';
        if ($fallbackName !== '') {
            return $fallbackName;
        }

        return is_string($user->email) ? trim($user->email) : '';
    }
}
