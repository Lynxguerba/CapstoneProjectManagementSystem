<?php

use App\Models\AcademicYear;
use App\Models\SystemSetting;
use App\Models\User;

test('admin can save an academic year into the database', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this
        ->actingAs($admin)
        ->put(route('admin.system-settings.update'), [
            'academicYear' => '2025–2026',
        ])
        ->assertRedirect(route('admin.system-settings'));

    expect(AcademicYear::query()
        ->where('start_year', 2025)
        ->where('end_year', 2026)
        ->where('is_current', true)
        ->exists())->toBeTrue();

    expect(SystemSetting::query()
        ->where('key', 'academicYear')
        ->value('value'))->toBe('2025-2026');
});

test('saving a new academic year deactivates the old current year', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    AcademicYear::factory()->create([
        'start_year' => 2024,
        'end_year' => 2025,
        'label' => '2024-2025',
        'is_current' => true,
    ]);

    $this
        ->actingAs($admin)
        ->put(route('admin.system-settings.update'), [
            'academicYear' => '2025-2026',
        ])
        ->assertRedirect(route('admin.system-settings'));

    expect(AcademicYear::query()->where('is_current', true)->count())->toBe(1);

    expect(AcademicYear::query()
        ->where('label', '2024-2025')
        ->value('is_current'))->toBeFalse();
});

test('admin cannot save an academic year that already exists', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    AcademicYear::factory()->create([
        'start_year' => 2025,
        'end_year' => 2026,
        'label' => '2025-2026',
        'is_current' => false,
    ]);

    $this
        ->actingAs($admin)
        ->from(route('admin.system-settings'))
        ->put(route('admin.system-settings.update'), [
            'academicYear' => '2025–2026',
        ])
        ->assertRedirect(route('admin.system-settings'))
        ->assertSessionHasErrors(['academicYear']);

    expect(AcademicYear::query()->where('label', '2025-2026')->count())->toBe(1);
});
