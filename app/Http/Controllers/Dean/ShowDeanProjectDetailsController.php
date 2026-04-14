<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ShowDeanProjectDetailsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $groupId = $request->query('group');
        $deanProgramScope = ['BSIT', 'BSIS'];

        $groupPayload = null;
        $approvedConceptPayload = null;
        $categoryOptions = [];
        $canSetCategory = false;

        $resolvedGroupId = null;
        if (is_string($groupId) && trim($groupId) !== '' && ctype_digit($groupId)) {
            $resolvedGroupId = (int) $groupId;
        } elseif (is_int($groupId)) {
            $resolvedGroupId = $groupId;
        }

        if (
            $resolvedGroupId !== null
            && class_exists(Group::class)
            && Schema::hasTable('groups')
            && Schema::hasTable('program_sets')
        ) {
            $query = Group::query()
                ->with([
                    'leader:id,name,first_name,last_name',
                    'programSet:id,name,program,academic_year_id,instructor_id',
                    'programSet.instructor:id,name,first_name,last_name',
                    'approvedConceptSubmission:id,group_id,document_requirement_id,title_category_id,file_name,file_path,mime_type,status,adviser_status,created_at',
                    'approvedConceptSubmission.requirement:id,requirement_type',
                    'approvedConceptSubmission.titleCategory:id,name',
                ])
                ->whereKey($resolvedGroupId)
                ->whereHas('programSet', fn (Builder $programSetQuery): Builder => $programSetQuery->whereIn('program', $deanProgramScope));

            if (Schema::hasTable('academic_years')) {
                $query->with('programSet.academicYear:id,label');
            }

            if (Schema::hasTable('group_members')) {
                $query->with('members:id,name,first_name,last_name');
            }

            if (Schema::hasTable('group_advisers')) {
                $query->with('adviserAssignment.adviser:id,name,first_name,last_name');
            }

            $group = $query->first(['id', 'name', 'program_set_id', 'leader_id', 'approved_concept_submission_id']);

            if ($group instanceof Group) {
                $groupProgram = is_string($group->programSet?->program) ? trim($group->programSet->program) : null;

                $groupPayload = [
                    'id' => $group->id,
                    'name' => (string) $group->name,
                    'program' => $groupProgram,
                    'programSetName' => $group->programSet?->name,
                    'academicYear' => $group->programSet?->academicYear?->label,
                    'adviserName' => Schema::hasTable('group_advisers')
                        ? $this->resolveDisplayName($group->adviserAssignment?->adviser)
                        : null,
                    'instructorName' => $this->resolveDisplayName($group->programSet?->instructor),
                    'leaderName' => $this->resolveDisplayName($group->leader),
                    'membersCount' => $this->countGroupMembers($group),
                    'members' => $this->buildMembersPayload($group),
                ];

                if (
                    $group->approvedConceptSubmission instanceof DocumentSubmission
                    && (int) $group->approvedConceptSubmission->group_id === (int) $group->id
                ) {
                    $submission = $group->approvedConceptSubmission;
                    $filePath = is_string($submission->file_path) ? trim($submission->file_path) : '';

                    $approvedConceptPayload = [
                        'id' => $submission->id,
                        'title' => (string) $submission->file_name,
                        'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Concept Paper'),
                        'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                        'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                        'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                        'titleCategoryId' => $submission->title_category_id,
                        'titleCategoryName' => $submission->titleCategory?->name,
                        'fileUrl' => $filePath !== '' ? Storage::disk('public')->url($filePath) : null,
                    ];
                }

                if (
                    $groupProgram !== null
                    && in_array($groupProgram, $deanProgramScope, true)
                    && Schema::hasTable('title_categories')
                ) {
                    $categoryOptions = TitleCategory::query()
                        ->where('program', $groupProgram)
                        ->orderBy('name')
                        ->get(['id', 'name', 'description'])
                        ->map(fn (TitleCategory $category): array => [
                            'id' => $category->id,
                            'name' => $category->name,
                            'description' => $category->description,
                        ])
                        ->values()
                        ->all();
                }

                $canSetCategory = $approvedConceptPayload !== null
                    && $groupProgram !== null
                    && in_array($groupProgram, $deanProgramScope, true)
                    && Schema::hasTable('title_categories')
                    && Schema::hasTable('document_submissions')
                    && Schema::hasColumn('document_submissions', 'title_category_id');
            }
        }

        return Inertia::render('Dean/project-details', [
            'group' => $groupPayload,
            'approvedConcept' => $approvedConceptPayload,
            'categoryOptions' => $categoryOptions,
            'canSetCategory' => $canSetCategory,
        ]);
    }

    /**
     * @return array<int, array{id: int, name: string, role: string}>
     */
    private function buildMembersPayload(Group $group): array
    {
        if (! Schema::hasTable('group_members')) {
            return [];
        }

        /** @var Collection<int, User> $members */
        $members = $group->members instanceof Collection ? $group->members : collect();

        return $members
            ->filter(fn (User $member): bool => ($group->leader?->id ?? null) !== $member->id)
            ->map(function (User $member): array {
                $memberRole = is_string($member->pivot?->role) && trim($member->pivot->role) !== ''
                    ? $this->formatRoleLabel((string) $member->pivot->role)
                    : 'Member';

                return [
                    'id' => $member->id,
                    'name' => $this->resolveDisplayName($member),
                    'role' => $memberRole,
                ];
            })
            ->unique('id')
            ->values()
            ->all();
    }

    private function countGroupMembers(Group $group): int
    {
        $count = 0;

        if ($group->leader instanceof User) {
            $count = 1;
        }

        if (Schema::hasTable('group_members')) {
            /** @var Collection<int, User> $members */
            $members = $group->members instanceof Collection ? $group->members : collect();

            $count += $members
                ->reject(fn (User $member): bool => ($group->leader?->id ?? null) === $member->id)
                ->unique('id')
                ->count();
        }

        return $count;
    }

    private function resolveDisplayName(?User $user): ?string
    {
        if (! $user) {
            return null;
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

        return null;
    }

    private function formatRoleLabel(string $value): string
    {
        $normalized = str_replace(['_', '-'], ' ', trim($value));

        return collect(explode(' ', $normalized))
            ->filter()
            ->map(fn (string $word): string => ucfirst(strtolower($word)))
            ->implode(' ');
    }
}
