<?php

use App\Models\AcademicYear;
use App\Models\StudentProgram;
use App\Models\TitleCategory;
use App\Models\TitleRepository;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows only BSIT title categories and records for BSIT students', function (): void {
    $student = User::factory()->create([
        'role' => 'student',
    ]);

    StudentProgram::query()->create([
        'student_id' => $student->id,
        'program' => 'BSIT',
    ]);

    $academicYear = AcademicYear::query()->create([
        'start_year' => 2023,
        'end_year' => 2024,
        'label' => 'A.Y 2023-2024',
        'is_current' => false,
    ]);

    $bsitCategory = TitleCategory::query()->create([
        'program' => 'BSIT',
        'name' => 'Software Development',
    ]);

    $bsisCategory = TitleCategory::query()->create([
        'program' => 'BSIS',
        'name' => 'Decision Support Systems (DSS)',
    ]);

    $bsitAdviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Noel',
        'last_name' => 'Rivera',
    ]);

    $bsisAdviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Karen',
        'last_name' => 'Lao',
    ]);

    TitleRepository::query()->create([
        'title' => 'Campus Laboratory Scheduling Platform',
        'title_category_id' => $bsitCategory->id,
        'academic_year_id' => $academicYear->id,
        'adviser_id' => $bsitAdviser->id,
        'status' => 'Approved',
    ]);

    TitleRepository::query()->create([
        'title' => 'Retail BI Dashboard',
        'title_category_id' => $bsisCategory->id,
        'academic_year_id' => $academicYear->id,
        'adviser_id' => $bsisAdviser->id,
        'status' => 'Approved',
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.titles'));

    $response->assertOk();

    $pageProps = data_get($response->viewData('page'), 'props', []);

    expect(data_get($pageProps, 'studentProgram'))->toBe('BSIT');

    $categories = collect(data_get($pageProps, 'categories', []));
    expect($categories)->toContain('Software Development');
    expect($categories)->not->toContain('Decision Support Systems (DSS)');

    $titles = collect(data_get($pageProps, 'titles', []));
    expect($titles->pluck('title')->all())->toContain('Campus Laboratory Scheduling Platform');
    expect($titles->pluck('title')->all())->not->toContain('Retail BI Dashboard');
    expect($titles->pluck('category')->unique()->all())->toBe(['Software Development']);
    expect($titles->pluck('adviser')->all())->toContain('Noel Rivera');
});

it('shows only BSIS title categories and records for BSIS students', function (): void {
    $student = User::factory()->create([
        'role' => 'student',
    ]);

    StudentProgram::query()->create([
        'student_id' => $student->id,
        'program' => 'BSIS',
    ]);

    $academicYear = AcademicYear::query()->create([
        'start_year' => 2024,
        'end_year' => 2025,
        'label' => 'A.Y 2024-2025',
        'is_current' => false,
    ]);

    $bsitCategory = TitleCategory::query()->create([
        'program' => 'BSIT',
        'name' => 'Network & Security',
    ]);

    $bsisCategory = TitleCategory::query()->create([
        'program' => 'BSIS',
        'name' => 'E-Commerce & Digital Markets',
    ]);

    $bsitAdviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Vince',
        'last_name' => 'Javier',
    ]);

    $bsisAdviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Erika',
        'last_name' => 'Uy',
    ]);

    TitleRepository::query()->create([
        'title' => 'Campus Network Forensics Toolkit',
        'title_category_id' => $bsitCategory->id,
        'academic_year_id' => $academicYear->id,
        'adviser_id' => $bsitAdviser->id,
        'status' => 'Approved',
    ]);

    TitleRepository::query()->create([
        'title' => 'Supplier and CRM Marketplace Platform',
        'title_category_id' => $bsisCategory->id,
        'academic_year_id' => $academicYear->id,
        'adviser_id' => $bsisAdviser->id,
        'status' => 'Archived',
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.titles'));

    $response->assertOk();

    $pageProps = data_get($response->viewData('page'), 'props', []);

    expect(data_get($pageProps, 'studentProgram'))->toBe('BSIS');

    $categories = collect(data_get($pageProps, 'categories', []));
    expect($categories)->toContain('E-Commerce & Digital Markets');
    expect($categories)->not->toContain('Network & Security');

    $titles = collect(data_get($pageProps, 'titles', []));
    expect($titles->pluck('title')->all())->toContain('Supplier and CRM Marketplace Platform');
    expect($titles->pluck('title')->all())->not->toContain('Campus Network Forensics Toolkit');
    expect($titles->pluck('category')->unique()->all())->toBe(['E-Commerce & Digital Markets']);
    expect($titles->pluck('adviser')->all())->toContain('Erika Uy');
});
