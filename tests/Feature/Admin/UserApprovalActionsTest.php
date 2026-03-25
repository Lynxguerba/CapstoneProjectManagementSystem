<?php

use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('approves a pending student account and keeps the assigned program active', function (): void {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $student = User::factory()->create([
        'role' => 'student',
        'status' => 'pending',
        'program' => 'BSIT',
    ]);
    $student->syncRoles(['student']);
    StudentProgram::query()->create([
        'student_id' => $student->id,
        'program' => 'BSIT',
    ]);

    $response = $this
        ->actingAs($admin)
        ->patch(route('admin.users.approve', $student).'?from=student');

    $response->assertRedirect(route('admin.users.students'));
    $response->assertSessionHas('success', 'Account approved and activated successfully.');

    expect($student->fresh()?->status)->toBe('active');
    expect($student->fresh()?->studentProgram?->program)->toBe('BSIT');
});

it('rejects a pending faculty registration request', function (): void {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $faculty = User::factory()->create([
        'role' => 'panelist',
        'status' => 'pending',
        'program' => 'BSIS',
    ]);
    $faculty->syncRoles(['panelist']);

    $response = $this
        ->actingAs($admin)
        ->patch(route('admin.users.reject', $faculty).'?from=faculty');

    $response->assertRedirect(route('admin.users.faculty'));
    $response->assertSessionHas('success', 'Account request rejected successfully.');

    expect($faculty->fresh()?->status)->toBe('inactive');
});
