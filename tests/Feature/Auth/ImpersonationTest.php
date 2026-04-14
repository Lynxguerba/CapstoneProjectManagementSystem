<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows a dean to impersonate another user', function (): void {
    $dean = User::factory()->create([
        'role' => 'dean',
    ]);
    $dean->syncRoles(['dean']);

    $student = User::factory()->create([
        'role' => 'student',
    ]);
    $student->syncRoles(['student']);

    $response = $this
        ->actingAs($dean, 'web')
        ->withSession(['active_role' => 'dean'])
        ->post(route('impersonation.store'), [
            'email' => $student->email,
        ]);

    $response->assertRedirect(route('student.dashboard'));
    $response->assertSessionHas('impersonator_id', $dean->id);
    $response->assertSessionHas('active_role', 'student');
    $this->assertAuthenticatedAs($student, 'web');
});

it('allows an impersonating dean session to switch directly to another account', function (): void {
    $dean = User::factory()->create([
        'role' => 'dean',
    ]);
    $dean->syncRoles(['dean']);

    $student = User::factory()->create([
        'role' => 'student',
    ]);
    $student->syncRoles(['student']);

    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $instructor->syncRoles(['instructor']);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession([
            'active_role' => 'student',
            'impersonator_id' => $dean->id,
        ])
        ->post(route('impersonation.store'), [
            'email' => $instructor->email,
        ]);

    $response->assertRedirect(route('instructor.dashboard'));
    $response->assertSessionHas('impersonator_id', $dean->id);
    $response->assertSessionHas('active_role', 'instructor');
    $this->assertAuthenticatedAs($instructor, 'web');
});

it('restores the dean session after leaving impersonation', function (): void {
    $dean = User::factory()->create([
        'role' => 'dean',
    ]);
    $dean->syncRoles(['dean']);

    $student = User::factory()->create([
        'role' => 'student',
    ]);
    $student->syncRoles(['student']);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession([
            'active_role' => 'student',
            'impersonator_id' => $dean->id,
        ])
        ->post(route('impersonation.destroy'));

    $response->assertRedirect(route('dean.dashboard'));
    $response->assertSessionMissing('impersonator_id');
    $response->assertSessionHas('active_role', 'dean');
    $this->assertAuthenticatedAs($dean, 'web');
});
