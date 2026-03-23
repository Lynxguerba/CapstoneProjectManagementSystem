<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('stores a concept submission against the active concept requirement', function (): void {
    Storage::fake('public');

    $context = createStudentConceptContext();
    $file = UploadedFile::fake()->create('smart-campus.pdf', 256, 'application/pdf');

    $response = $this
        ->actingAs($context['student'], 'web')
        ->withSession(['active_role' => 'student'])
        ->from(route('student.concepts'))
        ->post(route('student.concepts.submissions.store'), [
            'title' => 'Smart Campus Monitoring',
            'concept_file' => $file,
        ]);

    $response
        ->assertRedirect(route('student.concepts'))
        ->assertSessionHas('success', 'Concept paper submitted successfully.');

    $submission = DocumentSubmission::query()->first();

    expect($submission)->not->toBeNull();
    expect($submission?->document_requirement_id)->toBe($context['requirement']->id);
    expect($submission?->group_id)->toBe($context['group']->id);
    expect($submission?->file_name)->toBe('Smart Campus Monitoring');
    expect($submission?->status)->toBe('Submitted');

    Storage::disk('public')->assertExists((string) $submission?->file_path);
});

it('updates the concept title for a student submission', function (): void {
    $context = createStudentConceptContext();

    $submission = DocumentSubmission::factory()->create([
        'group_id' => $context['group']->id,
        'document_requirement_id' => $context['requirement']->id,
        'file_name' => 'Old Concept Title',
        'submitted_by' => $context['student']->id,
    ]);

    $response = $this
        ->actingAs($context['student'], 'web')
        ->withSession(['active_role' => 'student'])
        ->from(route('student.concepts'))
        ->patch(route('student.concepts.submissions.update', $submission), [
            'title' => 'Updated Concept Title',
        ]);

    $response
        ->assertRedirect(route('student.concepts'))
        ->assertSessionHas('success', 'Concept title updated successfully.');

    expect($submission->fresh()?->file_name)->toBe('Updated Concept Title');
});

it('deletes the concept submission record and stored pdf', function (): void {
    Storage::fake('public');

    $context = createStudentConceptContext();
    $storedPath = Storage::disk('public')->putFile('document-submissions', UploadedFile::fake()->create('concept-delete.pdf', 128, 'application/pdf'));

    $submission = DocumentSubmission::factory()->create([
        'group_id' => $context['group']->id,
        'document_requirement_id' => $context['requirement']->id,
        'file_name' => 'Delete Me',
        'file_path' => $storedPath,
        'submitted_by' => $context['student']->id,
    ]);

    Storage::disk('public')->assertExists($storedPath);

    $response = $this
        ->actingAs($context['student'], 'web')
        ->withSession(['active_role' => 'student'])
        ->from(route('student.concepts'))
        ->delete(route('student.concepts.submissions.destroy', $submission));

    $response
        ->assertRedirect(route('student.concepts'))
        ->assertSessionHas('success', 'Concept submission deleted successfully.');

    expect(DocumentSubmission::query()->find($submission->id))->toBeNull();
    Storage::disk('public')->assertMissing($storedPath);
});

/**
 * @return array{student: User, group: Group, requirement: DocumentRequirement}
 */
function createStudentConceptContext(): array
{
    $student = User::factory()->create([
        'role' => 'student',
    ]);

    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);

    $academicYear = AcademicYear::factory()->create();

    $programSet = ProgramSet::query()->create([
        'name' => 'BSIT '.$academicYear->label,
        'program' => 'BSIT',
        'academic_year_id' => $academicYear->id,
        'instructor_id' => $instructor->id,
    ]);

    $group = Group::query()->create([
        'program_set_id' => $programSet->id,
        'leader_id' => $student->id,
        'name' => 'Alpha Group',
    ]);

    $requirement = DocumentRequirement::factory()->create([
        'requirement_type' => 'Concept Paper',
        'stage' => 'Concept',
        'academic_year_id' => $academicYear->id,
    ]);

    return [
        'student' => $student,
        'group' => $group,
        'requirement' => $requirement,
    ];
}
