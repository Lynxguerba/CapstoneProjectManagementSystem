<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\ProgramSet;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

it('keeps previously assigned project categories in the dean dashboard after assigning another project', function (): void {
    $context = createDeanProjectCategoryDashboardContext();

    $this
        ->actingAs($context['dean'], 'web')
        ->withSession(['active_role' => 'dean'])
        ->from(route('dean.projects.details', ['group' => $context['firstGroup']->id]))
        ->put(route('dean.projects.details.category.update', ['group' => $context['firstGroup']->id]), [
            'title_category_id' => $context['firstCategory']->id,
        ])
        ->assertRedirect(route('dean.projects.details', ['group' => $context['firstGroup']->id]));

    $this
        ->actingAs($context['dean'], 'web')
        ->withSession(['active_role' => 'dean'])
        ->from(route('dean.projects.details', ['group' => $context['secondGroup']->id]))
        ->put(route('dean.projects.details.category.update', ['group' => $context['secondGroup']->id]), [
            'title_category_id' => $context['secondCategory']->id,
        ])
        ->assertRedirect(route('dean.projects.details', ['group' => $context['secondGroup']->id]));

    expect($context['firstSubmission']->fresh()?->title_category_id)->toBe($context['firstCategory']->id);
    expect($context['secondSubmission']->fresh()?->title_category_id)->toBe($context['secondCategory']->id);

    $response = $this
        ->actingAs($context['dean'], 'web')
        ->withSession(['active_role' => 'dean'])
        ->get(route('dean.dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dean/dashboard')
        ->where('categoriesByProgram.BSIT', function (array $categories) use ($context): bool {
            $categoriesByName = collect($categories)->keyBy('name');

            return (int) data_get($categoriesByName, $context['firstCategory']->name.'.projectCount') === 1
                && (int) data_get($categoriesByName, $context['secondCategory']->name.'.projectCount') === 1;
        }));
});

/**
 * @return array{
 *     dean: User,
 *     firstCategory: TitleCategory,
 *     secondCategory: TitleCategory,
 *     firstGroup: Group,
 *     secondGroup: Group,
 *     firstSubmission: DocumentSubmission,
 *     secondSubmission: DocumentSubmission
 * }
 */
function createDeanProjectCategoryDashboardContext(): array
{
    $dean = User::factory()->create([
        'role' => 'dean',
    ]);
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $leaderOne = User::factory()->create([
        'role' => 'student',
    ]);
    $leaderTwo = User::factory()->create([
        'role' => 'student',
    ]);

    $academicYear = AcademicYear::factory()->create([
        'label' => 'AY 2025-2026',
        'start_year' => 2025,
        'end_year' => 2026,
        'is_current' => true,
    ]);

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT 4A',
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $firstGroup = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $leaderOne->id,
        'name' => 'Group Alpha',
    ]);

    $secondGroup = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $leaderTwo->id,
        'name' => 'Group Beta',
    ]);

    $requirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
        'created_by' => $instructor->id,
    ]);

    $firstSubmission = DocumentSubmission::query()->create([
        'group_id' => $firstGroup->id,
        'document_requirement_id' => $requirement->id,
        'title_category_id' => null,
        'file_name' => 'AI Attendance Tracker',
        'file_path' => 'document-submissions/group-'.$firstGroup->id.'/concept/title.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Approved',
        'adviser_status' => 'Approved',
        'submitted_by' => $leaderOne->id,
    ]);

    $secondSubmission = DocumentSubmission::query()->create([
        'group_id' => $secondGroup->id,
        'document_requirement_id' => $requirement->id,
        'title_category_id' => null,
        'file_name' => 'Smart Waste Routing',
        'file_path' => 'document-submissions/group-'.$secondGroup->id.'/concept/title.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 12345,
        'status' => 'Approved',
        'adviser_status' => 'Approved',
        'submitted_by' => $leaderTwo->id,
    ]);

    $firstGroup->update([
        'approved_concept_submission_id' => $firstSubmission->id,
    ]);

    $secondGroup->update([
        'approved_concept_submission_id' => $secondSubmission->id,
    ]);

    $firstCategory = TitleCategory::query()->create([
        'program' => 'BSIT',
        'name' => 'Software Development',
        'description' => 'Software-focused capstone projects.',
    ]);

    $secondCategory = TitleCategory::query()->create([
        'program' => 'BSIT',
        'name' => 'Intelligent Systems',
        'description' => 'AI and machine-learning capstone projects.',
    ]);

    return [
        'dean' => $dean,
        'firstCategory' => $firstCategory,
        'secondCategory' => $secondCategory,
        'firstGroup' => $firstGroup->fresh() ?? $firstGroup,
        'secondGroup' => $secondGroup->fresh() ?? $secondGroup,
        'firstSubmission' => $firstSubmission,
        'secondSubmission' => $secondSubmission,
    ];
}
