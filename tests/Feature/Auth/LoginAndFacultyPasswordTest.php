<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('logs in adviser accounts with valid credentials and redirects to adviser dashboard', function (): void {
    $user = User::factory()->create([
        'email' => 'adviser-login@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
    ]);
    $user->syncRoles(['adviser']);

    $response = $this->post(route('login.store'), [
        'email' => 'adviser-login@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
    ]);

    $response->assertRedirect(route('adviser.dashboard'));
    $this->assertAuthenticatedAs($user, 'web');
});

it('supports legacy plaintext passwords and rehashes after successful login', function (): void {
    DB::table('users')->insert([
        'name' => 'Legacy Adviser',
        'first_name' => 'Legacy',
        'last_name' => 'Adviser',
        'email' => 'legacy-adviser@example.com',
        'password' => 'plain-text-pass',
        'role' => 'adviser',
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $user = User::query()->where('email', 'legacy-adviser@example.com')->firstOrFail();
    $user->syncRoles(['adviser']);

    $response = $this->post(route('login.store'), [
        'email' => 'legacy-adviser@example.com',
        'password' => 'plain-text-pass',
        'role' => 'adviser',
    ]);

    $response->assertRedirect(route('adviser.dashboard'));

    $user->refresh();

    expect(Hash::check('plain-text-pass', (string) $user->password))->toBeTrue();
});

it('stores the provided password when creating a faculty account', function (): void {
    $admin = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $response = $this
        ->actingAs($admin, 'web')
        ->post(route('admin.users.store', ['type' => 'faculty']), [
            'first_name' => 'Grace',
            'last_name' => 'Hopper',
            'email' => 'faculty-password@example.com',
            'roles' => ['adviser'],
            'password' => 'faculty-pass-123',
            'status' => 'active',
        ]);

    $response->assertRedirect(route('admin.users.faculty'));

    $faculty = User::query()->where('email', 'faculty-password@example.com')->firstOrFail();

    expect(Hash::check('faculty-pass-123', (string) $faculty->password))->toBeTrue();
});
