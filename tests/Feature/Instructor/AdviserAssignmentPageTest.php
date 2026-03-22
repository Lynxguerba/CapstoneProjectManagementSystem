<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows advisers from role assignments even when active role is not adviser', function (): void {
    $instructor = User::factory()->create([
        'role' => 'instructor',
    ]);
    $instructor->syncRoles(['instructor']);

    $multiRoleAdviser = User::factory()->create([
        'role' => 'instructor',
    ]);
    $multiRoleAdviser->syncRoles(['instructor', 'adviser']);

    $legacyAdviser = User::factory()->create([
        'role' => 'adviser',
    ]);

    $nonAdviser = User::factory()->create([
        'role' => 'instructor',
    ]);
    $nonAdviser->syncRoles(['instructor']);

    $response = $this
        ->actingAs($instructor, 'web')
        ->withSession(['active_role' => 'instructor'])
        ->get(route('instructor.adviser-assignment'));

    $response->assertOk();

    $adviserIds = collect(data_get($response->viewData('page'), 'props.advisers', []))
        ->pluck('id')
        ->values()
        ->all();

    expect($adviserIds)
        ->toContain($multiRoleAdviser->id)
        ->toContain($legacyAdviser->id)
        ->not->toContain($nonAdviser->id);
});
