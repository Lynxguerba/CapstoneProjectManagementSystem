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
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class GenerateRecommendationForTitleDefenseController extends Controller
{
    public function __invoke(
        Request $request,
        Group $group,
        RecommendationForTitleDefensePdfGenerator $pdfGenerator
    ): JsonResponse {
        $adviser = $request->user();
        if (! $adviser instanceof User || ! $adviser->hasRole('adviser')) {
            return response()->json([
                'message' => 'Only advisers can generate recommendation letters.',
            ], 403);
        }

        $group->loadMissing([
            'programSet:id,academic_year_id,instructor_id',
            'leader:id,name,first_name,last_name',
            'members:id,name,first_name,last_name',
            'adviserAssignment:group_id,adviser_id',
        ]);

        if ((int) ($group->adviserAssignment?->adviser_id ?? 0) !== (int) $adviser->id) {
            return response()->json([
                'message' => 'You are not assigned to this group.',
            ], 403);
        }

        /** @var DocumentRequirement|null $recommendationRequirement */
        $recommendationRequirement = DocumentRequirement::query()
            ->where('stage', 'Concept')
            ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
            ->when(
                $group->programSet?->academic_year_id !== null,
                fn ($query) => $query->where('academic_year_id', $group->programSet?->academic_year_id)
            )
            ->orderBy('due_date')
            ->first();

        if (! $recommendationRequirement instanceof DocumentRequirement) {
            $recommendationRequirement = DocumentRequirement::query()
                ->where('stage', 'Concept')
                ->whereRaw('LOWER(requirement_type) like ?', ['%recommendation%'])
                ->orderBy('due_date')
                ->first();
        }

        if (! $recommendationRequirement instanceof DocumentRequirement) {
            return response()->json([
                'message' => 'No recommendation requirement is configured for this group.',
            ], 422);
        }

        $conceptSubmissions = DocumentSubmission::query()
            ->with('requirement:id,requirement_type,stage')
            ->where('group_id', $group->id)
            ->whereHas('requirement', function ($query): void {
                $query->where('stage', 'Concept')
                    ->whereRaw('LOWER(requirement_type) like ?', ['%concept%']);
            })
            ->orderByDesc('created_at')
            ->get();

        if ($conceptSubmissions->isEmpty()) {
            return response()->json([
                'message' => 'No concept submissions are available for recommendation.',
            ], 422);
        }

        $hasUnapprovedSubmission = $conceptSubmissions->contains(
            fn (DocumentSubmission $submission): bool => $submission->status !== 'Approved' || $submission->adviser_status !== 'Approved'
        );

        if ($hasUnapprovedSubmission) {
            return response()->json([
                'message' => 'All concept submissions must be approved by adviser and instructor before generating recommendation.',
            ], 422);
        }

        $approvedTitles = $conceptSubmissions
            ->map(fn (DocumentSubmission $submission): string => trim((string) ($submission->file_name ?? '')))
            ->filter(fn (string $title): bool => $title !== '')
            ->unique()
            ->values()
            ->all();

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
                'message' => 'Register your e-signature in Adviser Settings before generating a recommendation letter.',
            ], 422);
        }

        $adviserName = $this->resolveUserName($adviser);
        $signedAt = now();
        $templatePath = storage_path('app/private/templates/Recommendation-Title-Defense-2025.pdf');

        try {
            $generatedPdfPath = $pdfGenerator->generate(
                $templatePath,
                $signatureData,
                $approvedTitles,
                $submittedByNames,
                $adviserName,
                $signedAt
            );
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Unable to generate recommendation PDF. '.$exception->getMessage(),
            ], 500);
        }

        $timestamp = $signedAt->format('Ymd-His');
        $fileName = Str::slug($group->name !== '' ? $group->name : 'group')."-recommendation-title-defense-{$timestamp}.pdf";
        $relativePath = "recommendations/group-{$group->id}/{$fileName}";
        $disk = Storage::disk('public');

        $disk->put($relativePath, File::get($generatedPdfPath));
        $fileSize = $disk->size($relativePath);

        $submission = DocumentSubmission::query()->create([
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
        ]);

        $recommendationRecord = AdviserRecommendationDocument::query()->create([
            'group_id' => $group->id,
            'adviser_id' => $adviser->id,
            'document_requirement_id' => $recommendationRequirement->id,
            'document_submission_id' => $submission->id,
            'file_name' => $fileName,
            'file_path' => $relativePath,
            'approved_titles' => $approvedTitles,
            'submitted_by_names' => $submittedByNames,
            'signed_at' => $signedAt,
        ]);

        File::deleteDirectory(dirname($generatedPdfPath));

        return response()->json([
            'message' => 'Recommendation letter generated successfully.',
            'recommendation' => [
                'id' => $recommendationRecord->id,
                'file_name' => $fileName,
                'file_url' => $disk->url($relativePath),
                'signed_at' => $signedAt->format('Y-m-d H:i'),
                'document_submission_id' => $submission->id,
            ],
        ], 201);
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
