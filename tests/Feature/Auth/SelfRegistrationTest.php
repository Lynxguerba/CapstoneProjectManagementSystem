<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores self-registration requests as pending accounts with a generated institutional email', function (): void {
    $response = $this->post(route('register.store'), [
        'first_name' => 'Dinno',
        'last_name' => 'Guerba',
        'program' => 'BSIT',
        'password' => 'secretpass',
        'password_confirmation' => 'secretpass',
        'role' => 'student',
    ]);

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('success');

    $user = User::query()->where('email', 'guerba.dinno@dnsc.ic.ph')->first();

    expect($user)->not->toBeNull();
    expect($user?->first_name)->toBe('Dinno');
    expect($user?->last_name)->toBe('Guerba');
    expect($user?->role)->toBe('student');
    expect($user?->status)->toBe('pending');
    expect($user?->program)->toBe('BSIT');
    expect($user?->hasRole('student'))->toBeTrue();
    expect($user?->studentProgram?->program)->toBe('BSIT');
});

it('requires the password confirmation to match during self-registration', function (): void {
    $response = $this->from(route('login'))->post(route('register.store'), [
        'first_name' => 'Dinno',
        'last_name' => 'Guerba',
        'program' => 'BSIT',
        'password' => 'secretpass',
        'password_confirmation' => 'wrongpass',
        'role' => 'student',
    ]);

    $response
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'password' => 'Password confirmation does not match.',
        ]);

    expect(User::query()->where('email', 'guerba.dinno@dnsc.ic.ph')->exists())->toBeFalse();
});

it('requires a program selection when self-registering as a student or panel chair', function (): void {
    $studentResponse = $this->from(route('login'))->post(route('register.store'), [
        'first_name' => 'Dinno',
        'last_name' => 'Guerba',
        'password' => 'secretpass',
        'password_confirmation' => 'secretpass',
        'role' => 'student',
    ]);

    $studentResponse
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'program' => 'Program selection is required for the selected role.',
        ]);

    $panelChairResponse = $this->from(route('login'))->post(route('register.store'), [
        'first_name' => 'Paula',
        'last_name' => 'Chair',
        'password' => 'secretpass',
        'password_confirmation' => 'secretpass',
        'role' => 'program_chairperson',
    ]);

    $panelChairResponse
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'program' => 'Program selection is required for the selected role.',
        ]);
});

it('stores the selected program for a pending panel chair registration without creating a student program profile', function (): void {
    $response = $this->post(route('register.store'), [
        'first_name' => 'Paula',
        'last_name' => 'Chair',
        'program' => 'BSIS',
        'password' => 'secretpass',
        'password_confirmation' => 'secretpass',
        'role' => 'program_chairperson',
    ]);

    $response->assertRedirect(route('login'));

    $user = User::query()->where('email', 'chair.paula@dnsc.ic.ph')->first();

    expect($user)->not->toBeNull();
    expect($user?->role)->toBe('program_chairperson');
    expect($user?->status)->toBe('pending');
    expect($user?->program)->toBe('BSIS');
    expect($user?->studentProgram()->exists())->toBeFalse();
});

it('prevents pending accounts from logging in', function (): void {
    $user = User::factory()->create([
        'email' => 'pending-user@example.com',
        'password' => 'secretpass',
        'role' => 'adviser',
        'status' => 'pending',
    ]);
    $user->syncRoles(['adviser']);

    $response = $this->from(route('login'))->post(route('login.store'), [
        'email' => 'pending-user@example.com',
        'password' => 'secretpass',
    ]);

    $response
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors([
            'email' => 'Your registration is pending admin approval.',
        ]);

    $this->assertGuest('web');
});
