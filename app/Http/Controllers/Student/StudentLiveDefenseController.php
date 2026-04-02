<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StudentLiveDefenseController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $panelists = $this->resolveGroupPanelists($group);
        $panelApprovalTotal = count($panelists);
        $recommendationLetter = $this->resolveLatestRecommendationLetter($group);
        $academicYearId = $group?->programSet?->academic_year_id;
        $conceptRequirements = $this->resolveConceptRequirements($academicYearId);
        $conceptSubmissions = $this->resolveConceptSubmissions(
            $group?->id,
            $conceptRequirements->pluck('id')->values(),
        );

        return Inertia::render('Student/live-defense', [
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
            ] : null,
            'conceptSubmissions' => $conceptSubmissions
                ->map(fn (DocumentSubmission $submission): array => [
                    'id' => $submission->id,
                    'title' => (string) $submission->file_name,
                    'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Concept Paper'),
                    'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                    'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                    'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                    'panelApprovalCount' => $this->resolvePanelApprovalCount($submission, $panelApprovalTotal),
                    'panelApprovalTotal' => $panelApprovalTotal,
                    'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                ])
                ->values()
                ->all(),
            'panelists' => $panelists,
            'recommendationLetter' => $recommendationLetter,
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
        $hasGroupPanelistsTable = Schema::hasTable('group_panelists');
        $hasUsersTable = Schema::hasTable('users');

        $query = Group::query();

        if ($hasProgramSetsTable) {
            $query->with('programSet:id,name,academic_year_id');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear:id,label');
            }
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

        return $query->first(['id', 'name', 'program_set_id', 'leader_id']);
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

    private function resolvePanelApprovalCount(DocumentSubmission $submission, int $panelApprovalTotal): int
    {
        if ($panelApprovalTotal < 1) {
            return 0;
        }

        $isFullyApproved = $submission->status === 'Approved' && $submission->adviser_status === 'Approved';

        return $isFullyApproved ? $panelApprovalTotal : 0;
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
}
