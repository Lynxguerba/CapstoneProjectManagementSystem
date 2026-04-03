<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('does not store switch role requests in audit logs', function (): void {
    $user = User::factory()->create([
        'email' => 'multirole-audit@example.com',
        'password' => 'secretpass',
        'role' => 'admin',
    ]);
    $user->syncRoles(['admin', 'adviser']);

    $response = $this
        ->actingAs($user, 'web')
        ->post(route('switch-role'), [
            'role' => 'adviser',
        ]);

    $response->assertRedirect(route('adviser.dashboard'));
    $response->assertSessionHas('active_role', 'adviser');

    $this->assertDatabaseMissing('audit_logs', [
        'route_name' => 'switch-role',
    ]);
});
