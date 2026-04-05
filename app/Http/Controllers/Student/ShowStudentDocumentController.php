<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ShowStudentDocumentController extends Controller
{
    public function __invoke(string $type, int $id): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $isGroupLeader = $group !== null
            && $student !== null
            && (int) $group->leader_id === (int) $student->id;

        abort_unless($group instanceof Group, 403);

        $document = match ($type) {
            'submission' => $this->resolveSubmissionDocument($group, $id, $isGroupLeader),
            'recommendation' => $this->resolveRecommendationDocument($group, $id),
            default => null,
        };

        abort_if($document === null, 404);

        return Inertia::render('Student/documents/show', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
            ],
            'isGroupLeader' => $isGroupLeader,
            'document' => $document,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveSubmissionDocument(Group $group, int $id, bool $isGroupLeader): ?array
    {
        if (! Schema::hasTable('document_submissions')) {
            return null;
        }

        $submission = DocumentSubmission::query()
            ->with([
                'requirement:id,requirement_type,stage',
                'adviserRecommendationDocument:id,document_submission_id',
            ])
            ->where('group_id', $group->id)
            ->find($id, [
                'id',
                'group_id',
                'document_requirement_id',
                'file_name',
                'file_path',
                'mime_type',
                'file_size',
                'status',
                'adviser_status',
                'created_at',
            ]);

        if (! $submission instanceof DocumentSubmission) {
            return null;
        }

        $filePath = is_string($submission->file_path) ? trim($submission->file_path) : '';
        $fileUrl = $filePath !== '' ? Storage::disk('public')->url($filePath) : null;
        $requirementType = (string) ($submission->requirement?->requirement_type ?? 'Document Submission');

        $isRecommendationSubmission = str_contains(strtolower($requirementType), 'recommendation')
            || $submission->adviserRecommendationDocument !== null;

        return [
            'id' => $submission->id,
            'source' => 'Uploaded by Group',
            'title' => (string) $submission->file_name,
            'requirementType' => $requirementType,
            'stage' => (string) ($submission->requirement?->stage ?? 'N/A'),
            'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
            'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
            'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
            'mimeType' => $submission->mime_type,
            'fileSizeLabel' => $this->formatFileSize($submission->file_size),
            'fileUrl' => $fileUrl,
            'signedBy' => null,
            'canRemove' => $isGroupLeader && ! $isRecommendationSubmission,
            'removeUrl' => $isGroupLeader && ! $isRecommendationSubmission
                ? route('student.documents.submissions.destroy', $submission)
                : null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveRecommendationDocument(Group $group, int $id): ?array
    {
        if (! Schema::hasTable('adviser_recommendation_documents')) {
            return null;
        }

        $recommendation = AdviserRecommendationDocument::query()
            ->with([
                'adviser:id,name,first_name,last_name,email',
                'requirement:id,requirement_type,stage',
                'submission:id,status,file_size',
            ])
            ->where('group_id', $group->id)
            ->whereHas('submission', function (Builder $query): void {
                $query->whereIn('status', ['Approved', 'Submitted']);
            })
            ->find($id, [
                'id',
                'group_id',
                'adviser_id',
                'document_requirement_id',
                'document_submission_id',
                'file_name',
                'file_path',
                'signed_at',
            ]);

        if (! $recommendation instanceof AdviserRecommendationDocument) {
            return null;
        }

        $filePath = is_string($recommendation->file_path) ? trim($recommendation->file_path) : '';
        $fileUrl = $filePath !== '' ? Storage::disk('public')->url($filePath) : null;

        return [
            'id' => $recommendation->id,
            'source' => 'Generated by System',
            'title' => (string) $recommendation->file_name,
            'requirementType' => (string) ($recommendation->requirement?->requirement_type ?? 'Recommendation Letter'),
            'stage' => (string) ($recommendation->requirement?->stage ?? 'Concept'),
            'submittedAt' => $recommendation->signed_at?->format('Y-m-d H:i'),
            'instructorStatus' => $this->resolveRecommendationInstructorStatus($recommendation),
            'adviserStatus' => 'Approved',
            'mimeType' => 'application/pdf',
            'fileSizeLabel' => $this->formatFileSize($recommendation->submission?->file_size),
            'fileUrl' => $fileUrl,
            'signedBy' => $this->resolveUserName($recommendation->adviser),
            'canRemove' => false,
            'removeUrl' => null,
        ];
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

    private function resolveRecommendationInstructorStatus(AdviserRecommendationDocument $recommendation): string
    {
        $status = (string) ($recommendation->submission?->status ?? 'Approved');

        if ($status === 'Submitted') {
            return 'Approved';
        }

        return $status !== '' ? $status : 'Approved';
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
