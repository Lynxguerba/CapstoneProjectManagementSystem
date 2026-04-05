<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentDocumentsController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $isGroupLeader = $group !== null
            && $student !== null
            && (int) $group->leader_id === (int) $student->id;

        $uploadedFiles = $this->resolveUploadedFiles($group?->id);
        $generatedFiles = $this->resolveGeneratedFiles($group?->id);

        return Inertia::render('Student/documents', [
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
            ] : null,
            'isGroupLeader' => $isGroupLeader,
            'uploadedFiles' => $uploadedFiles
                ->map(fn (DocumentSubmission $submission): array => [
                    'id' => $submission->id,
                    'title' => (string) $submission->file_name,
                    'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Document Submission'),
                    'stage' => (string) ($submission->requirement?->stage ?? 'N/A'),
                    'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                    'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                    'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                    'fileSizeLabel' => $this->formatFileSize($submission->file_size),
                    'viewUrl' => route('student.documents.show', [
                        'type' => 'submission',
                        'id' => $submission->id,
                    ]),
                    'removeUrl' => $isGroupLeader
                        ? route('student.documents.submissions.destroy', $submission)
                        : null,
                ])
                ->values()
                ->all(),
            'generatedFiles' => $generatedFiles
                ->map(fn (AdviserRecommendationDocument $recommendation): array => [
                    'id' => $recommendation->id,
                    'title' => (string) $recommendation->file_name,
                    'requirementType' => (string) ($recommendation->requirement?->requirement_type ?? 'Recommendation Letter'),
                    'stage' => (string) ($recommendation->requirement?->stage ?? 'Concept'),
                    'signedAt' => $recommendation->signed_at?->format('Y-m-d H:i'),
                    'instructorStatus' => $this->resolveRecommendationInstructorStatus($recommendation),
                    'adviserStatus' => 'Approved',
                    'fileSizeLabel' => $this->formatFileSize($recommendation->submission?->file_size),
                    'adviserName' => $this->resolveUserName($recommendation->adviser),
                    'viewUrl' => route('student.documents.show', [
                        'type' => 'recommendation',
                        'id' => $recommendation->id,
                    ]),
                ])
                ->values()
                ->all(),
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

        $query = Group::query();

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

        return $query->first(['id', 'name', 'program_set_id', 'leader_id']);
    }

    /**
     * @return Collection<int, DocumentSubmission>
     */
    private function resolveUploadedFiles(?int $groupId): Collection
    {
        if (
            $groupId === null
            || ! Schema::hasTable('document_submissions')
            || ! Schema::hasTable('document_requirements')
        ) {
            return collect();
        }

        return DocumentSubmission::query()
            ->with('requirement:id,requirement_type,stage')
            ->where('group_id', $groupId)
            ->whereHas('requirement', function (Builder $query): void {
                $query->whereRaw('LOWER(requirement_type) not like ?', ['%recommendation%']);
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'group_id',
                'document_requirement_id',
                'file_name',
                'status',
                'adviser_status',
                'file_size',
                'created_at',
            ]);
    }

    /**
     * @return Collection<int, AdviserRecommendationDocument>
     */
    private function resolveGeneratedFiles(?int $groupId): Collection
    {
        if (
            $groupId === null
            || ! Schema::hasTable('adviser_recommendation_documents')
            || ! Schema::hasTable('document_submissions')
        ) {
            return collect();
        }

        $latestRecommendation = AdviserRecommendationDocument::query()
            ->with([
                'adviser:id,name,first_name,last_name,email',
                'requirement:id,requirement_type,stage',
                'submission:id,status,file_size',
            ])
            ->where('group_id', $groupId)
            ->whereHas('submission', function (Builder $query): void {
                $query->whereIn('status', ['Approved', 'Submitted']);
            })
            ->orderByDesc('signed_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'group_id',
                'adviser_id',
                'document_requirement_id',
                'document_submission_id',
                'file_name',
                'signed_at',
            ])
            ->first();

        return $latestRecommendation instanceof AdviserRecommendationDocument
            ? collect([$latestRecommendation])
            : collect();
    }

    private function resolveRecommendationInstructorStatus(AdviserRecommendationDocument $recommendation): string
    {
        $status = (string) ($recommendation->submission?->status ?? 'Approved');

        if ($status === 'Submitted') {
            return 'Approved';
        }

        return $status !== '' ? $status : 'Approved';
    }

    private function resolveUserName(?User $user): ?string
    {
        if (! $user instanceof User) {
            return null;
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

        return $user->email;
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
