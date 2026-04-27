<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
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
        $adviserId = Auth::guard('web')->id();

        return Inertia::render('Adviser/manuscripts', [
            'groups' => $adviserId !== null ? $this->resolveGroups($adviserId) : [],
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
     *     member_names: array<int, string>,
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
            ])
            ->whereHas('adviserAssignment', fn (Builder $query): Builder => $query->where('adviser_id', $adviserId))
            ->orderByDesc('updated_at')
            ->get(['id', 'name', 'program_set_id', 'leader_id', 'updated_at']);

        $manuscriptsByGroup = $this->resolveManuscriptsByGroup($groups->pluck('id')->all());

        return $groups
            ->map(function (Group $group) use ($manuscriptsByGroup): array {
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

                return [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'leader_name' => $this->resolveUserName($group->leader),
                    'program_set_id' => $programSet?->id,
                    'program_set_name' => $programSet?->name ?: $fallbackProgramSetName,
                    'school_year' => $schoolYear,
                    'updated_at' => $latestSubmission?->created_at?->format('Y-m-d') ?? $group->updated_at?->format('Y-m-d'),
                    'member_names' => $memberNames,
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

        return DocumentSubmission::query()
            ->with('requirement:id,stage,requirement_type')
            ->whereIn('group_id', $groupIds)
            ->whereHas('requirement', fn (Builder $query): Builder => $query->where('stage', 'Outline'))
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
            ->filter(fn (DocumentSubmission $submission): bool => $this->isOutlineManuscriptRequirement(
                $submission->requirement?->requirement_type,
                $submission->requirement?->stage,
            ))
            ->groupBy('group_id');
    }

    private function isOutlineManuscriptRequirement(?string $requirementType, ?string $stage): bool
    {
        if (strtolower(trim((string) $stage)) !== 'outline') {
            return false;
        }

        $normalizedRequirementType = strtolower(trim((string) $requirementType));

        return str_contains($normalizedRequirementType, 'manuscript')
            || str_contains($normalizedRequirementType, 'project outline')
            || $normalizedRequirementType === 'outline';
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
