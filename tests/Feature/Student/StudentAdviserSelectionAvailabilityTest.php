<?php

use App\Models\AdviserAvailability;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('defaults advisers without availability records to closed in adviser selection', function (): void {
    $student = User::factory()->create([
        'role' => 'student',
    ]);

    $adviserWithoutAvailability = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Default',
        'last_name' => 'Open',
    ]);

    $openAdviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Open',
        'last_name' => 'Adviser',
    ]);

    $closedAdviser = User::factory()->create([
        'role' => 'adviser',
        'first_name' => 'Closed',
        'last_name' => 'Adviser',
    ]);

    AdviserAvailability::query()->create([
        'adviser_id' => $openAdviser->id,
        'is_available' => true,
    ]);

    AdviserAvailability::query()->create([
        'adviser_id' => $closedAdviser->id,
        'is_available' => false,
    ]);

    $response = $this
        ->actingAs($student, 'web')
        ->withSession(['active_role' => 'student'])
        ->get(route('student.adviser-selection'));

    $response->assertOk();

    $advisers = collect(data_get($response->viewData('page'), 'props.advisers', []))
        ->keyBy('id');

    expect(data_get($advisers->get($adviserWithoutAvailability->id), 'is_available'))->toBeFalse();
    expect(data_get($advisers->get($openAdviser->id), 'is_available'))->toBeTrue();
    expect(data_get($advisers->get($closedAdviser->id), 'is_available'))->toBeFalse();
});
