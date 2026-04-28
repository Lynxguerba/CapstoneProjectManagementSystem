<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\AdviserRecommendationDocument;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use App\Services\RecommendationForTitleDefensePdfGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GenerateRecommendationForOutlineDefenseController extends Controller
{
    public function __invoke(
        Request $request,
        Group $group,
        RecommendationForTitleDefensePdfGenerator $pdfGenerator,
    ): JsonResponse {
        $adviser = $request->user();
        if (! $adviser instanceof User || ! $adviser->hasRole('adviser')) {
            return response()->json([
                'message' => 'Only advisers can generate outline recommendation letters.',
            ], 403);
        }

        $group->loadMissing([
            'programSet:id,program,academic_year_id,instructor_id',
            'leader:id,name,first_name,last_name',
            'members:id,name,first_name,last_name',
            'adviserAssignment:group_id,adviser_id',
            'approvedConceptSubmission:id,file_name',
        ]);

        if ((int) ($group->adviserAssignment?->adviser_id ?? 0) !== (int) $adviser->id) {
            return response()->json([
                'message' => 'You are not assigned to this group.',
            ], 403);
        }

        /** @var DocumentRequirement|null $recommendationRequirement */
        $recommendationRequirement = DocumentRequirement::query()
            ->where('stage', 'Outline')
            ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
            ->when(
                $group->programSet?->academic_year_id !== null,
                fn ($query) => $query->where('academic_year_id', $group->programSet?->academic_year_id)
            )
            ->orderBy('due_date')
            ->first();

        if (! $recommendationRequirement instanceof DocumentRequirement) {
            $recommendationRequirement = DocumentRequirement::query()
                ->where('stage', 'Outline')
                ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
                ->whereNull('academic_year_id')
                ->orderBy('due_date')
                ->first();
        }

        if (! $recommendationRequirement instanceof DocumentRequirement) {
            return response()->json([
                'message' => 'No outline recommendation requirement is configured for this group.',
            ], 422);
        }

        $outlineManuscripts = DocumentSubmission::query()
            ->with('requirement:id,requirement_type,stage')
            ->where('group_id', $group->id)
            ->whereHas('requirement', function ($query): void {
                $query->where('stage', 'Outline');
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $outlineManuscripts = $outlineManuscripts
            ->filter(fn (DocumentSubmission $submission): bool => $this->isOutlineManuscriptRequirement(
                $submission->requirement?->requirement_type,
                $submission->requirement?->stage,
            ))
            ->values();

        if ($outlineManuscripts->isEmpty()) {
            return response()->json([
                'message' => 'No outline manuscript submissions are available for recommendation.',
            ], 422);
        }

        $hasUnapprovedManuscript = $outlineManuscripts->contains(
            fn (DocumentSubmission $submission): bool => $submission->adviser_status !== 'Approved'
        );

        if ($hasUnapprovedManuscript) {
            return response()->json([
                'message' => 'All outline manuscript submissions must be approved by adviser before generating recommendation.',
            ], 422);
        }

        $projectTitle = is_string($group->approvedConceptSubmission?->file_name)
            ? trim($group->approvedConceptSubmission->file_name)
            : '';

        if ($projectTitle === '') {
            return response()->json([
                'message' => 'No approved project title is linked to this group yet.',
            ], 422);
        }

        $memberNames = collect([$group->leader, ...$group->members->all()])
            ->filter(fn (?User $member): bool => $member instanceof User)
            ->map(fn (User $member): string => $this->resolveUserName($member))
            ->filter(fn (string $name): bool => $name !== '')
            ->unique()
            ->values()
            ->all();

        $submittedByNames = $this->joinNamesForSentence($memberNames);

        $adviser->loadMissing('eSignature');
        $signatureData = (string) ($adviser->eSignature?->signature_data ?? '');
        if ($signatureData === '') {
            return response()->json([
                'message' => 'Register your e-signature in Adviser Settings before generating an outline recommendation letter.',
            ], 422);
        }

        $adviserName = $this->resolveUserName($adviser);
        $signedAt = now();
        $templatePath = base_path('Recommendation for Outline Defense.pdf');

        try {
            $generatedPdfPath = $pdfGenerator->generateOutlineDefense(
                $templatePath,
                $signatureData,
                $projectTitle,
                $group->name,
                $submittedByNames,
                $adviserName,
                $signedAt,
                is_string($group->programSet?->program) ? $group->programSet->program : null,
            );
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to generate outline recommendation PDF. '.$exception->getMessage(),
            ], 500);
        }

        $fileName = 'Recommendation for Outline Defense.pdf';
        $relativePath = "recommendations/group-{$group->id}/outline/recommendation-for-outline-defense.pdf";
        $disk = Storage::disk('public');

        $disk->put($relativePath, File::get($generatedPdfPath));
        $fileSize = $disk->size($relativePath);

        $pathsToDeleteFromStorage = [];
        $statusCode = 201;
        $submissionId = null;

        [$recommendationRecord, $submissionId, $statusCode, $pathsToDeleteFromStorage] = DB::transaction(function () use (
            $adviser,
            $fileName,
            $fileSize,
            $group,
            $projectTitle,
            $recommendationRequirement,
            $relativePath,
            $signedAt,
            $submittedByNames,
        ): array {
            $existingRecommendations = AdviserRecommendationDocument::query()
                ->where('group_id', $group->id)
                ->whereHas('requirement', function ($query): void {
                    $query->where('stage', 'Outline')
                        ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%']);
                })
                ->orderByDesc('signed_at')
                ->orderByDesc('id')
                ->get([
                    'id',
                    'document_submission_id',
                    'file_path',
                ]);

            /** @var AdviserRecommendationDocument|null $primaryRecommendation */
            $primaryRecommendation = $existingRecommendations->first();
            $primarySubmissionId = is_numeric($primaryRecommendation?->document_submission_id)
                ? (int) $primaryRecommendation->document_submission_id
                : null;

            /** @var DocumentSubmission|null $primarySubmission */
            $primarySubmission = $primarySubmissionId !== null
                ? DocumentSubmission::query()->find($primarySubmissionId, [
                    'id',
                    'group_id',
                    'document_requirement_id',
                    'file_path',
                ])
                : null;

            $pathsToDelete = collect();
            if (
                $primarySubmission instanceof DocumentSubmission
                && is_string($primarySubmission->file_path)
                && trim($primarySubmission->file_path) !== ''
                && trim($primarySubmission->file_path) !== $relativePath
            ) {
                $pathsToDelete->push(trim($primarySubmission->file_path));
            }

            if (
                $primaryRecommendation instanceof AdviserRecommendationDocument
                && is_string($primaryRecommendation->file_path)
                && trim($primaryRecommendation->file_path) !== ''
                && trim($primaryRecommendation->file_path) !== $relativePath
            ) {
                $pathsToDelete->push(trim($primaryRecommendation->file_path));
            }

            $submissionData = [
                'group_id' => $group->id,
                'document_requirement_id' => $recommendationRequirement->id,
                'file_name' => $fileName,
                'file_path' => $relativePath,
                'mime_type' => 'application/pdf',
                'file_size' => is_int($fileSize) ? $fileSize : null,
                'status' => 'Submitted',
                'adviser_status' => 'Approved',
                'submitted_by' => $adviser->id,
                'adviser_reviewed_by' => $adviser->id,
                'adviser_reviewed_at' => $signedAt,
            ];

            if ($primarySubmission instanceof DocumentSubmission) {
                $primarySubmission->update($submissionData);
                $submission = $primarySubmission->fresh();
            } else {
                $submission = DocumentSubmission::query()->create($submissionData);
            }

            $recommendationData = [
                'group_id' => $group->id,
                'adviser_id' => $adviser->id,
                'document_requirement_id' => $recommendationRequirement->id,
                'document_submission_id' => $submission->id,
                'file_name' => $fileName,
                'file_path' => $relativePath,
                'approved_titles' => [$projectTitle],
                'submitted_by_names' => $submittedByNames,
                'signed_at' => $signedAt,
            ];

            if ($primaryRecommendation instanceof AdviserRecommendationDocument) {
                $primaryRecommendation->update($recommendationData);
                $recommendationRecord = $primaryRecommendation->fresh();
                $responseStatusCode = 200;
            } else {
                $recommendationRecord = AdviserRecommendationDocument::query()->create($recommendationData);
                $responseStatusCode = 201;
            }

            $duplicateRecommendationIds = $existingRecommendations
                ->skip(1)
                ->pluck('id')
                ->filter(fn ($id): bool => is_numeric($id))
                ->map(fn ($id): int => (int) $id)
                ->values()
                ->all();

            $duplicateSubmissionIds = $existingRecommendations
                ->skip(1)
                ->pluck('document_submission_id')
                ->filter(fn ($id): bool => is_numeric($id))
                ->map(fn ($id): int => (int) $id)
                ->unique()
                ->reject(fn (int $id): bool => $id === (int) $submission->id)
                ->values()
                ->all();

            if ($duplicateRecommendationIds !== []) {
                $duplicateRecommendationPaths = AdviserRecommendationDocument::query()
                    ->whereIn('id', $duplicateRecommendationIds)
                    ->pluck('file_path')
                    ->filter(fn ($path): bool => is_string($path) && trim($path) !== '')
                    ->map(fn (string $path): string => trim($path))
                    ->values();

                $pathsToDelete = $pathsToDelete->merge($duplicateRecommendationPaths);

                AdviserRecommendationDocument::query()
                    ->whereIn('id', $duplicateRecommendationIds)
                    ->delete();
            }

            if ($duplicateSubmissionIds !== []) {
                $duplicateSubmissionPaths = DocumentSubmission::query()
                    ->whereIn('id', $duplicateSubmissionIds)
                    ->pluck('file_path')
                    ->filter(fn ($path): bool => is_string($path) && trim($path) !== '')
                    ->map(fn (string $path): string => trim($path))
                    ->values();

                $pathsToDelete = $pathsToDelete->merge($duplicateSubmissionPaths);

                DocumentSubmission::query()
                    ->whereIn('id', $duplicateSubmissionIds)
                    ->delete();
            }

            /** @var AdviserRecommendationDocument $recommendationRecord */
            return [
                $recommendationRecord,
                (int) $submission->id,
                $responseStatusCode,
                $pathsToDelete
                    ->unique()
                    ->reject(fn (string $path): bool => $path === $relativePath)
                    ->values()
                    ->all(),
            ];
        });

        collect($pathsToDeleteFromStorage)
            ->filter(fn ($path): bool => is_string($path) && trim($path) !== '')
            ->each(fn (string $path): bool => $disk->delete($path));

        File::deleteDirectory(dirname($generatedPdfPath));

        return response()->json([
            'message' => 'Outline recommendation letter generated successfully.',
            'recommendation' => [
                'id' => $recommendationRecord->id,
                'file_name' => $fileName,
                'file_url' => $disk->url($relativePath),
                'signed_at' => $signedAt->format('Y-m-d H:i'),
                'document_submission_id' => $submissionId,
            ],
        ], $statusCode);
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

    private function resolveUserName(User $user): string
    {
        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        return is_string($user->name) ? trim($user->name) : '';
    }

    /**
     * @param  array<int, string>  $names
     */
    private function joinNamesForSentence(array $names): string
    {
        $normalizedNames = collect($names)
            ->map(fn (string $name): string => trim($name))
            ->filter(fn (string $name): bool => $name !== '')
            ->values()
            ->all();

        if ($normalizedNames === []) {
            return 'No student members';
        }

        if (count($normalizedNames) === 1) {
            return $normalizedNames[0];
        }

        if (count($normalizedNames) === 2) {
            return $normalizedNames[0].' and '.$normalizedNames[1];
        }

        $lastName = array_pop($normalizedNames);

        return implode(', ', $normalizedNames).', and '.$lastName;
    }
}
