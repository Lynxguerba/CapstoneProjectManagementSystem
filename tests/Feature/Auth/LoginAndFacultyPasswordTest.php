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

it('returns a specific error when the email address is not registered', function (): void {
    $response = $this
        ->from(route('login'))
        ->post(route('login.store'), [
            'email' => 'unknown-account@example.com',
            'password' => 'secretpass',
        ]);

    $response
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'email' => 'This email address is not registered in our system.',
        ])
        ->assertSessionMissing('lockout_until')
        ->assertSessionMissing('locked_email');
});

it('shows the remaining password attempts before the account is locked', function (): void {
    $user = User::factory()->create([
        'email' => 'remaining-attempts@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'status' => 'active',
    ]);
    $user->syncRoles(['adviser']);

    $firstResponse = $this
        ->from(route('login'))
        ->post(route('login.store'), [
            'email' => 'remaining-attempts@example.com',
            'password' => 'wrong-password',
        ]);

    $firstResponse
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'password' => 'The password you entered is incorrect. You have 2 attempts remaining.',
        ]);

    $secondResponse = $this
        ->from(route('login'))
        ->post(route('login.store'), [
            'email' => 'remaining-attempts@example.com',
            'password' => 'still-wrong',
        ]);

    $secondResponse
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'password' => 'The password you entered is incorrect. You have 1 attempts remaining.',
        ]);
});

it('locks the account for ten minutes after the third incorrect password attempt', function (): void {
    $user = User::factory()->create([
        'email' => 'locked-account@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'status' => 'active',
    ]);
    $user->syncRoles(['adviser']);

    foreach (range(1, 2) as $attempt) {
        $this
            ->from(route('login'))
            ->post(route('login.store'), [
                'email' => 'locked-account@example.com',
                'password' => 'wrong-password',
            ]);
    }

    $response = $this
        ->from(route('login'))
        ->post(route('login.store'), [
            'email' => 'locked-account@example.com',
            'password' => 'wrong-password',
        ]);

    $response
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'email' => 'Too many login attempts.',
        ])
        ->assertSessionHas('error', 'Too many login attempts.')
        ->assertSessionHas('locked_email', 'locked-account@example.com')
        ->assertSessionHas('lockout_until', static function ($value): bool {
            expect($value)->toBeInt();
            expect($value)->toBeGreaterThanOrEqual(now()->addMinutes(9)->timestamp * 1000);
            expect($value)->toBeLessThanOrEqual(now()->addMinutes(10)->timestamp * 1000);

            return true;
        });

    $this->assertGuest('web');
});

it('keeps a locked account locked across ip addresses while allowing another account to sign in', function (): void {
    $lockedUser = User::factory()->create([
        'email' => 'locked-cross-browser@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'status' => 'active',
    ]);
    $lockedUser->syncRoles(['adviser']);

    $otherUser = User::factory()->create([
        'email' => 'other-account@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'status' => 'active',
    ]);
    $otherUser->syncRoles(['adviser']);

    foreach (range(1, 3) as $attempt) {
        $this
            ->withServerVariables(['REMOTE_ADDR' => '198.51.100.10'])
            ->from(route('login'))
            ->post(route('login.store'), [
                'email' => 'locked-cross-browser@example.com',
                'password' => 'wrong-password',
            ]);
    }

    $lockedResponse = $this
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.25'])
        ->from(route('login'))
        ->post(route('login.store'), [
            'email' => 'locked-cross-browser@example.com',
            'password' => 'secretpass',
        ]);

    $lockedResponse
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'email' => 'Too many login attempts.',
        ])
        ->assertSessionHas('locked_email', 'locked-cross-browser@example.com');

    $this->assertGuest('web');

    $allowedResponse = $this
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.30'])
        ->post(route('login.store'), [
            'email' => 'other-account@example.com',
            'password' => 'secretpass',
        ]);

    $allowedResponse->assertRedirect(route('adviser.dashboard'));
    $this->assertAuthenticatedAs($otherUser, 'web');
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
