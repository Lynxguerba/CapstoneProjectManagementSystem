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
    ]);

    $response->assertRedirect(route('adviser.dashboard'));

    $user->refresh();

    expect(Hash::check('plain-text-pass', (string) $user->password))->toBeTrue();
});

it('logs multi-role accounts into their stored active role', function (): void {
    $user = User::factory()->create([
        'email' => 'multirole@example.com',
        'password' => 'secretpass',
        'role' => 'panelist',
    ]);
    $user->syncRoles(['adviser', 'panelist']);

    $response = $this->post(route('login.store'), [
        'email' => 'multirole@example.com',
        'password' => 'secretpass',
    ]);

    $response->assertRedirect(route('panelist.dashboard'));
    $response->assertSessionHas('active_role', 'panelist');
    $this->assertAuthenticatedAs($user, 'web');
});

it('allows login when the same account is active in another browser', function (): void {
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

    $user = User::factory()->create([
        'email' => 'already-active@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'active_session_id' => 'brave-session-id',
        'active_session_last_activity_at' => now(),
    ]);
    $user->syncRoles(['adviser']);

    $response = $this->post(route('login.store'), [
        'email' => 'already-active@example.com',
        'password' => 'secretpass',
    ]);

    $response->assertRedirect(route('adviser.dashboard'));
    $this->assertAuthenticatedAs($user, 'web');
});

it('allows login when a previous session marker is already stale', function (): void {
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

    $user = User::factory()->create([
        'email' => 'expired-session@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'active_session_id' => 'expired-session-id',
        'active_session_last_activity_at' => now()->subMinutes(((int) config('session.lifetime', 120)) + 5),
    ]);
    $user->syncRoles(['adviser']);

    $response = $this->post(route('login.store'), [
        'email' => 'expired-session@example.com',
        'password' => 'secretpass',
    ]);

    $response->assertRedirect(route('adviser.dashboard'));
    $this->assertAuthenticatedAs($user, 'web');

    $user->refresh();

    expect((string) $user->active_session_id)->not->toBe('expired-session-id');
    expect($user->active_session_last_activity_at)->not->toBeNull();
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
