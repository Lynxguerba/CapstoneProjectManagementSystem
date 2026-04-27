<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
        $isPhaseTwoAvailable = $this->isPhaseTwoAvailable($group);

        $uploadedFiles = $this->resolveUploadedFiles($group?->id);
        $approvedConceptSubmissionId = $this->resolveApprovedConceptSubmissionId($group, $uploadedFiles);
        $generatedFiles = $this->resolveGeneratedFiles($group?->id);
        $phaseTwoRequirements = $this->resolvePhaseTwoRequirements($group, $isPhaseTwoAvailable);

        $documentsComponent = file_exists(resource_path('js/pages/Student/documents.tsx'))
            ? 'Student/documents'
            : 'Student/documents/index';

        return Inertia::render($documentsComponent, [
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
            ] : null,
            'isGroupLeader' => $isGroupLeader,
            'isPhase2Available' => $isPhaseTwoAvailable,
            'approvedConceptSubmissionId' => $approvedConceptSubmissionId,
            'phase2Requirements' => $phaseTwoRequirements,
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
                ->when(
                    $group !== null,
                    function (Collection $rows) use ($group): Collection {
                        $minutesDocument = $this->resolveConceptVerdictMinutesDocument($group->id);

                        if ($minutesDocument === null) {
                            return $rows;
                        }

                        return $rows->push([
                            'id' => 900000000 + $group->id,
                            'title' => $minutesDocument['fileName'],
                            'requirementType' => 'Minutes of Adviser Verdict',
                            'stage' => 'Concept',
                            'signedAt' => $minutesDocument['signedAt'],
                            'instructorStatus' => 'Approved',
                            'adviserStatus' => 'Approved',
                            'fileSizeLabel' => $minutesDocument['fileSizeLabel'],
                            'adviserName' => $this->resolveUserName($group->adviserAssignment?->adviser),
                            'viewUrl' => route('student.documents.show', [
                                'type' => 'minutes',
                                'id' => $group->id,
                            ]),
                        ]);
                    }
                )
                ->values()
                ->all(),
        ])->rootView('app');
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

        $query = Group::query();

        if ($hasProgramSetsTable) {
            $query->with('programSet:id,name,academic_year_id');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear:id,label');
            }
        }

        if ($hasGroupAdvisersTable) {
            $query->with('adviserAssignment:group_id,adviser_id');
            $query->with('adviserAssignment.adviser:id,name,first_name,last_name,email');
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

        return $query->first($groupColumns);
    }

    /**
     * @return array<int, array{
     *     id: int,
     *     requirementType: string,
     *     stage: string,
     *     dueDate: string|null,
     *     status: string,
     *     fileName: string|null,
     *     submittedAt: string|null
     * }>
     */
    private function resolvePhaseTwoRequirements(?Group $group, bool $isPhaseTwoAvailable): array
    {
        if (
            ! $isPhaseTwoAvailable
            || ! $group instanceof Group
            || ! Schema::hasTable('document_requirements')
            || ! class_exists(DocumentRequirement::class)
        ) {
            return [];
        }

        $requirementsQuery = DocumentRequirement::query()
            ->with('academicYear:id,label')
            ->where('stage', 'Outline')
            ->orderBy('due_date')
            ->orderBy('id');

        $academicYearId = $group->programSet?->academic_year_id;

        if (is_int($academicYearId)) {
            $requirementsQuery->where(function (Builder $query) use ($academicYearId): void {
                $query->where('academic_year_id', $academicYearId)
                    ->orWhereNull('academic_year_id');
            });
        }

        $requirements = $requirementsQuery->get([
            'id',
            'requirement_type',
            'due_date',
            'stage',
            'academic_year_id',
        ]);

        if ($requirements->isEmpty() || ! Schema::hasTable('document_submissions')) {
            return $requirements
                ->map(static fn (DocumentRequirement $requirement): array => [
                    'id' => $requirement->id,
                    'requirementType' => (string) ($requirement->requirement_type ?? 'Outline Requirement'),
                    'stage' => (string) ($requirement->stage ?? 'Outline'),
                    'dueDate' => $requirement->due_date?->format('Y-m-d'),
                    'status' => 'Missing',
                    'fileName' => null,
                    'submittedAt' => null,
                ])
                ->values()
                ->all();
        }

        $latestSubmissionsByRequirementId = DocumentSubmission::query()
            ->where('group_id', $group->id)
            ->whereIn('document_requirement_id', $requirements->pluck('id')->all())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'document_requirement_id',
                'file_name',
                'status',
                'created_at',
            ])
            ->unique('document_requirement_id')
            ->keyBy('document_requirement_id');

        return $requirements
            ->map(static function (DocumentRequirement $requirement) use ($latestSubmissionsByRequirementId): array {
                /** @var DocumentSubmission|null $submission */
                $submission = $latestSubmissionsByRequirementId->get($requirement->id);

                $status = match ((string) ($submission?->status ?? '')) {
                    'Approved' => 'Approved',
                    'Revision Required' => 'Revision Required',
                    'Submitted' => 'Submitted',
                    default => $submission instanceof DocumentSubmission ? 'Submitted' : 'Missing',
                };

                return [
                    'id' => $requirement->id,
                    'requirementType' => (string) ($requirement->requirement_type ?? 'Outline Requirement'),
                    'stage' => (string) ($requirement->stage ?? 'Outline'),
                    'dueDate' => $requirement->due_date?->format('Y-m-d'),
                    'status' => $status,
                    'fileName' => $submission?->file_name,
                    'submittedAt' => $submission?->created_at?->format('Y-m-d H:i'),
                ];
            })
            ->values()
            ->all();
    }

    private function isPhaseTwoAvailable(?Group $group): bool
    {
        if (! $group instanceof Group) {
            return false;
        }

        if (Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            return is_numeric($group->approved_concept_submission_id)
                && (int) $group->approved_concept_submission_id > 0;
        }

        if (! Schema::hasColumn('groups', 'concept_verdict') || ! is_string($group->concept_verdict)) {
            return false;
        }

        $normalizedVerdict = strtolower(trim($group->concept_verdict));

        if ($normalizedVerdict === '') {
            return false;
        }

        if (str_contains($normalizedVerdict, 'failed') || str_contains($normalizedVerdict, 'deferred') || str_contains($normalizedVerdict, 'deffered')) {
            return false;
        }

        return str_contains($normalizedVerdict, 'pass') || str_contains($normalizedVerdict, 'approved');
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

        $uploadedFiles = DocumentSubmission::query()
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

        $latestManuscriptSubmissionId = $uploadedFiles
            ->first(fn (DocumentSubmission $submission): bool => $this->isOutlineManuscriptSubmission($submission))
            ?->id;

        return $uploadedFiles
            ->filter(function (DocumentSubmission $submission) use ($latestManuscriptSubmissionId): bool {
                if (! $this->isOutlineManuscriptSubmission($submission)) {
                    return true;
                }

                return $submission->id === $latestManuscriptSubmissionId;
            })
            ->values();
    }

    /**
     * @param  Collection<int, DocumentSubmission>  $uploadedFiles
     */
    private function resolveApprovedConceptSubmissionId(?Group $group, Collection $uploadedFiles): ?int
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

        $isApprovedSubmissionStillAvailable = $uploadedFiles
            ->contains(fn (DocumentSubmission $submission): bool => (int) $submission->id === $approvedConceptSubmissionId);

        return $isApprovedSubmissionStillAvailable ? $approvedConceptSubmissionId : null;
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

    private function isOutlineManuscriptSubmission(DocumentSubmission $submission): bool
    {
        return $this->isOutlineManuscriptRequirement(
            $submission->requirement?->requirement_type,
            $submission->requirement?->stage,
        );
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

    /**
     * @return array{fileName: string, fileUrl: string, signedAt: string|null, fileSizeLabel: string|null}|null
     */
    private function resolveConceptVerdictMinutesDocument(int $groupId): ?array
    {
        $disk = Storage::disk('public');
        $directory = "concept-verdict-minutes/group-{$groupId}";

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

        $fileSizeLabel = null;
        try {
            $fileSize = (int) $disk->size($latestPath);
            $fileSizeLabel = $fileSize > 0 ? $this->formatFileSize($fileSize) : null;
        } catch (Throwable) {
            $fileSizeLabel = null;
        }

        return [
            'fileName' => basename($latestPath),
            'fileUrl' => $disk->url($latestPath),
            'signedAt' => $signedAt,
            'fileSizeLabel' => $fileSizeLabel,
        ];
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
