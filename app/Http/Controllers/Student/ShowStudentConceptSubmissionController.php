<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ShowStudentConceptSubmissionController extends Controller
{
    public function __invoke(DocumentSubmission $submission): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);

        $submission->loadMissing([
            'requirement:id,requirement_type,stage,due_date',
            'group:id,name,program_set_id',
            'group.programSet:id,name,program,academic_year_id',
            'group.programSet.academicYear:id,label',
            'titleCategory:id,name,program,description',
        ]);

        abort_unless(
            $group instanceof Group
                && $submission->group_id === $group->id
                && $submission->requirement?->stage === 'Concept',
            403,
        );

        $studentProgram = in_array($submission->group->programSet?->program, ['BSIT', 'BSIS'], true)
            ? (string) $submission->group->programSet?->program
            : 'BSIT';

        return Inertia::render('Student/concepts/show', [
            'group' => [
                'id' => $submission->group->id,
                'name' => $submission->group->name,
                'programSetName' => $submission->group->programSet?->name,
                'academicYear' => $submission->group->programSet?->academicYear?->label,
            ],
            'studentProgram' => $studentProgram,
            'categoryOptions' => $this->resolveConceptCategories($studentProgram)
                ->map(fn (TitleCategory $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                ])
                ->values()
                ->all(),
            'submission' => [
                'id' => $submission->id,
                'title' => (string) $submission->file_name,
                'titleCategoryId' => $submission->title_category_id,
                'category' => $submission->titleCategory?->name,
                'categoryDescription' => $submission->titleCategory?->description,
                'status' => (string) ($submission->status ?? 'Submitted'),
                'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Concept Paper'),
                'deadlineLabel' => $submission->requirement?->due_date?->format('F d, Y').' · 11:59 PM',
                'mimeType' => $submission->mime_type,
                'fileSizeLabel' => $this->formatFileSize($submission->file_size),
                'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
            ],
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, TitleCategory>
     */
    private function resolveConceptCategories(string $studentProgram): \Illuminate\Support\Collection
    {
        if (! Schema::hasTable('title_categories')) {
            return collect();
        }

        return TitleCategory::query()
            ->where('program', $studentProgram)
            ->orderBy('name')
            ->get(['id', 'name', 'program', 'description']);
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');

        return Group::query()
            ->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
                $groupQuery->where('leader_id', $studentId);

                if ($hasGroupMembersTable) {
                    $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                        $memberQuery->where('users.id', $studentId);
                    });
                }
            })
            ->first(['id']);
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
