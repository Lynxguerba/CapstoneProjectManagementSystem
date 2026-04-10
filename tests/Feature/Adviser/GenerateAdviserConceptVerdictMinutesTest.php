<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\ESignature;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use App\Models\ProgramSet;
use App\Models\User;
use App\Services\AdviserConceptVerdictMinutesPdfGenerator;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * @return array{
 *     adviser: User,
 *     panelist: User,
 *     group: Group,
 *     approvedSubmission: DocumentSubmission,
 *     rejectedSubmission: DocumentSubmission
 * }
 */
function seedConceptVerdictMinutesData(): array
{
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $adviser = User::factory()->create([
        'role' => 'adviser',
    ]);
    $panelChairman = User::factory()->create([
        'role' => 'panelist',
    ]);
    $panelMember = User::factory()->create([
        'role' => 'panelist',
    ]);
    $leader = User::factory()->create([
        'role' => 'student',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => 'AY 2025-2026',
        'is_current' => true,
    ]);

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT 4A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $group = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $leader->id,
        'name' => 'Group Alpha',
        'concept_verdict' => 'Pass with Revision',
        'concept_verdict_by_panelist_id' => $panelChairman->id,
        'concept_verdict_decided_at' => now(),
    ]);

    GroupAdviser::query()->create([
        'group_id' => $group->id,
        'adviser_id' => $adviser->id,
        'assigned_by' => $instructor->id,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $panelChairman->id,
        'panel_slot' => 1,
        'role' => 'chairman',
        'assigned_by' => $instructor->id,
    ]);

    GroupPanelist::query()->create([
        'group_id' => $group->id,
        'panelist_id' => $panelMember->id,
        'panel_slot' => 2,
        'role' => 'member',
        'assigned_by' => $instructor->id,
    ]);

    $conceptRequirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
        'created_by' => $instructor->id,
    ]);

    $approvedSubmission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $conceptRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Approved Concept Title',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/approved.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Submitted',
        'adviser_status' => 'Submitted',
        'submitted_by' => $leader->id,
    ]);

    $rejectedSubmission = DocumentSubmission::query()->create([
        'group_id' => $group->id,
        'document_requirement_id' => $conceptRequirement->id,
        'title_category_id' => null,
        'file_name' => 'Rejected Concept Title',
        'file_path' => 'document-submissions/group-'.$group->id.'/concept/rejected.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Submitted',
        'adviser_status' => 'Submitted',
        'submitted_by' => $leader->id,
    ]);

    $group->update([
        'approved_concept_submission_id' => $approvedSubmission->id,
    ]);

    LiveDefenseComment::query()->create([
        'group_id' => $group->id,
        'document_submission_id' => $approvedSubmission->id,
        'author_id' => $panelChairman->id,
        'author_role' => 'Panelist',
        'message' => 'Approved submission panelist note',
        'is_highlight_comment' => false,
    ]);

    LiveDefenseComment::query()->create([
        'group_id' => $group->id,
        'document_submission_id' => $approvedSubmission->id,
        'author_id' => $adviser->id,
        'referenced_panelist_id' => $panelChairman->id,
        'author_role' => 'Adviser',
        'message' => 'Approved submission adviser note',
        'is_highlight_comment' => false,
    ]);

    LiveDefenseComment::query()->create([
        'group_id' => $group->id,
        'document_submission_id' => $rejectedSubmission->id,
        'author_id' => $panelChairman->id,
        'author_role' => 'Panelist',
        'message' => 'Rejected submission panelist note',
        'is_highlight_comment' => false,
    ]);

    LiveDefenseComment::query()->create([
        'group_id' => $group->id,
        'document_submission_id' => $rejectedSubmission->id,
        'author_id' => $adviser->id,
        'referenced_panelist_id' => $panelChairman->id,
        'author_role' => 'Adviser',
        'message' => 'Rejected submission adviser note',
        'is_highlight_comment' => false,
    ]);

    ESignature::query()->create([
        'user_id' => $adviser->id,
        'signature_data' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZxJ0AAAAASUVORK5CYII=',
        'mime_type' => 'image/png',
    ]);

    return [
        'adviser' => $adviser,
        'panelist' => $panelChairman,
        'group' => $group,
        'approvedSubmission' => $approvedSubmission,
        'rejectedSubmission' => $rejectedSubmission,
    ];
}

it('uses only approved concept comments when generating verdict minutes', function (): void {
    Storage::fake('public');

    $data = seedConceptVerdictMinutesData();
    $captured = (object) [
        'commentsByPanelist' => [],
    ];

    $this->app->instance(
        AdviserConceptVerdictMinutesPdfGenerator::class,
        new class($captured) extends AdviserConceptVerdictMinutesPdfGenerator
        {
            public function __construct(private object $captured) {}

            public function generate(
                string $signatureDataUrl,
                string $adviserName,
                CarbonInterface $signedAt,
                string $defenseDate,
                string $timeStarted,
                string $timeEnded,
                array $proponentNames,
                ?string $chairmanName,
                array $memberPanelistNames,
                array $commentsByPanelist,
                string $verdict,
                ?string $approvedTitle
            ): string {
                $this->captured->commentsByPanelist = $commentsByPanelist;

                $temporaryDirectory = storage_path('app/private/tmp/test-concept-verdict-minutes-'.uniqid('', true));
                File::ensureDirectoryExists($temporaryDirectory);

                $pdfPath = $temporaryDirectory.'/concept-verdict-minutes.pdf';
                File::put($pdfPath, 'fake-pdf-binary');

                return $pdfPath;
            }
        }
    );

    $csrfToken = 'minutes-generation-token';

    $this->actingAs($data['adviser'], 'web')
        ->withSession([
            'active_role' => 'adviser',
            '_token' => $csrfToken,
        ])
        ->postJson(route('adviser.live-defense.groups.concept-verdict-minutes', [
            'group' => $data['group']->id,
        ]), [
            '_token' => $csrfToken,
        ])
        ->assertOk();

    $allComments = collect($captured->commentsByPanelist)
        ->flatMap(fn (array $commentGroup): array => $commentGroup['comments'] ?? [])
        ->values()
        ->all();

    expect($allComments)->toContain('Approved submission panelist note');
    expect($allComments)->toContain('Approved submission adviser note');
    expect($allComments)->not->toContain('Rejected submission panelist note');
    expect($allComments)->not->toContain('Rejected submission adviser note');
});
