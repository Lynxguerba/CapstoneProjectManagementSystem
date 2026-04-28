<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdviserManuscriptController extends Controller
{
    public function __invoke(): Response
    {
        $adviser = Auth::guard('web')->user();
        $adviserId = $adviser?->id;
        $adviser?->loadMissing('eSignature');

        return Inertia::render('Adviser/manuscripts', [
            'groups' => $adviserId !== null ? $this->resolveGroups($adviserId) : [],
            'hasESignature' => $adviser?->eSignature !== null,
        ]);
    }

    /**
     * @return array<int, array{
     *     group_id: int,
     *     group_name: string,
     *     leader_name: string,
     *     program_set_id: int|null,
     *     program_set_name: string,
     *     school_year: string|null,
     *     updated_at: string|null,
     *     project_title: string|null,
     *     member_names: array<int, string>,
     *     has_recommendation_requirement: bool,
     *     recommendation_requirement_id: int|null,
     *     recommendation_requirement_type: string|null,
     *     recommendation_document: array{
     *         id: int,
     *         file_name: string,
     *         file_url: string,
     *         signed_at: string|null
     *     }|null,
     *     manuscripts: array<int, array{
     *         id: int,
     *         title: string,
     *         requirement_type: string,
     *         stage: string,
     *         adviser_status: string,
     *         submitted_at: string|null,
     *         adviser_reviewed_at: string|null,
     *         file_size_label: string|null,
     *         file_url: string|null
     *     }>
     * }>
     */
    private function resolveGroups(int $adviserId): array
    {
        if (! Schema::hasTable('groups') || ! Schema::hasTable('group_advisers')) {
            return [];
        }

        $groups = Group::query()
            ->with([
                'programSet.academicYear',
                'leader:id,name,first_name,last_name,email',
                'members:id,name,first_name,last_name,email',
                'approvedConceptSubmission:id,file_name',
            ])
            ->whereHas('adviserAssignment', fn (Builder $query): Builder => $query->where('adviser_id', $adviserId))
            ->orderByDesc('updated_at')
            ->get(['id', 'name', 'program_set_id', 'leader_id', 'updated_at']);

        $manuscriptsByGroup = $this->resolveManuscriptsByGroup($groups->pluck('id')->all());
        $academicYearIds = $groups
            ->map(fn (Group $group): ?int => $group->programSet?->academic_year_id)
            ->filter()
            ->unique()
            ->values();

        $recommendationRequirementsByAcademicYearId = $academicYearIds->isEmpty()
            ? collect()
            : DocumentRequirement::query()
                ->where('stage', 'Outline')
                ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
                ->whereIn('academic_year_id', $academicYearIds->all())
                ->orderBy('due_date')
                ->get(['id', 'academic_year_id', 'requirement_type'])
                ->groupBy('academic_year_id')
                ->map(fn (Collection $requirements): ?DocumentRequirement => $requirements->first());

        $defaultRecommendationRequirement = DocumentRequirement::query()
            ->where('stage', 'Outline')
            ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
            ->whereNull('academic_year_id')
            ->orderBy('due_date')
            ->first(['id', 'academic_year_id', 'requirement_type']);

        $latestRecommendationByGroupId = AdviserRecommendationDocument::query()
            ->whereIn('group_id', $groups->pluck('id')->all())
            ->whereHas('requirement', fn (Builder $query): Builder => $query->where('stage', 'Outline'))
            ->orderByDesc('signed_at')
            ->orderByDesc('id')
            ->get(['id', 'group_id', 'file_name', 'file_path', 'signed_at'])
            ->unique('group_id')
            ->keyBy('group_id');

        return $groups
            ->map(function (Group $group) use (
                $defaultRecommendationRequirement,
                $latestRecommendationByGroupId,
                $manuscriptsByGroup,
                $recommendationRequirementsByAcademicYearId,
            ): array {
                $programSet = $group->programSet;
                $schoolYear = $programSet?->academicYear?->label ?? $programSet?->school_year;
                $fallbackProgramSetName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                $groupManuscripts = $manuscriptsByGroup->get($group->id, collect());
                $latestSubmission = $groupManuscripts->first();
                $memberNames = collect([$group->leader, ...$group->members->all()])
                    ->filter(fn (?User $member): bool => $member instanceof User)
                    ->map(fn (User $member): string => $this->resolveUserName($member))
                    ->filter(fn (string $name): bool => $name !== '')
                    ->unique()
                    ->values()
                    ->all();
                $recommendationRequirement = $recommendationRequirementsByAcademicYearId->get($programSet?->academic_year_id)
                    ?? $defaultRecommendationRequirement;
                $recommendationDocument = $latestRecommendationByGroupId->get($group->id);

                return [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'leader_name' => $this->resolveUserName($group->leader),
                    'program_set_id' => $programSet?->id,
                    'program_set_name' => $programSet?->name ?: $fallbackProgramSetName,
                    'school_year' => $schoolYear,
                    'updated_at' => $latestSubmission?->created_at?->format('Y-m-d') ?? $group->updated_at?->format('Y-m-d'),
                    'project_title' => is_string($group->approvedConceptSubmission?->file_name)
                        ? trim($group->approvedConceptSubmission->file_name)
                        : null,
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
                    'manuscripts' => $groupManuscripts
                        ->map(function (DocumentSubmission $submission): array {
                            $adviserStatus = match ((string) $submission->adviser_status) {
                                'Approved' => 'Approved',
                                'Revision Required' => 'Revision Required',
                                default => 'Submitted',
                            };

                            return [
                                'id' => $submission->id,
                                'title' => (string) $submission->file_name,
                                'requirement_type' => (string) ($submission->requirement?->requirement_type ?? 'Manuscript'),
                                'stage' => (string) ($submission->requirement?->stage ?? 'Outline'),
                                'adviser_status' => $adviserStatus,
                                'submitted_at' => $submission->created_at?->format('Y-m-d H:i'),
                                'adviser_reviewed_at' => $submission->adviser_reviewed_at?->format('Y-m-d H:i'),
                                'file_size_label' => $this->formatFileSize($submission->file_size),
                                'file_url' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<int, int>  $groupIds
     * @return Collection<int, Collection<int, DocumentSubmission>>
     */
    private function resolveManuscriptsByGroup(array $groupIds): Collection
    {
        if (
            $groupIds === []
            || ! Schema::hasTable('document_submissions')
            || ! Schema::hasTable('document_requirements')
        ) {
            return collect();
        }

        $stages = ['Outline', 'Pre-Deployment', 'Deployment', 'Final'];

        return DocumentSubmission::query()
            ->with('requirement:id,stage,requirement_type')
            ->whereIn('group_id', $groupIds)
            ->whereHas('requirement', fn (Builder $query): Builder => $query->whereIn('stage', $stages))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'group_id',
                'document_requirement_id',
                'file_name',
                'file_path',
                'file_size',
                'adviser_status',
                'adviser_reviewed_at',
                'created_at',
            ])
            ->filter(fn (DocumentSubmission $submission): bool => $this->isManuscriptRequirement(
                $submission->requirement?->requirement_type,
                $submission->requirement?->stage,
            ))
            ->groupBy('group_id');
    }

    private function isManuscriptRequirement(?string $requirementType, ?string $stage): bool
    {
        $allowedStages = ['outline', 'pre-deployment', 'deployment', 'final'];
        $normalizedStage = strtolower(trim((string) $stage));

        if (! in_array($normalizedStage, $allowedStages, true)) {
            return false;
        }

        $normalizedRequirementType = strtolower(trim((string) $requirementType));

        return str_contains($normalizedRequirementType, 'manuscript')
            || str_contains($normalizedRequirementType, 'project outline')
            || $normalizedRequirementType === 'outline'
            || $normalizedRequirementType === 'pre-deployment'
            || $normalizedRequirementType === 'deployment'
            || $normalizedRequirementType === 'final';
    }

    private function resolveUserName(?User $user): string
    {
        if (! $user instanceof User) {
            return 'N/A';
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

        return is_string($user->email) && trim($user->email) !== ''
            ? $user->email
            : 'N/A';
    }

    private function formatFileSize(?int $size): ?string
    {
        if (! is_int($size) || $size <= 0) {
            return null;
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $value = (float) $size;
        $unitIndex = 0;

        while ($value >= 1024 && $unitIndex < count($units) - 1) {
            $value /= 1024;
            $unitIndex++;
        }

        $formatted = $unitIndex === 0
            ? (string) ((int) $value)
            : number_format($value, 1);

        return $formatted.' '.$units[$unitIndex];
    }
}
