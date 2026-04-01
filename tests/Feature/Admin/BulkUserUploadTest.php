<?php

use App\Jobs\ProcessBulkUserImport;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('imports student rows when type is sent in the request payload', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $admin = User::factory()->create([
        'email' => 'admin-bulk-upload@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $response = $this
        ->withSession(['active_role' => 'admin'])
        ->actingAs($admin, 'web')
        ->post(route('admin.users.bulk-store'), [
            'type' => 'student',
            'rows' => [
                [
                    'first_name' => 'Juan',
                    'last_name' => 'Dela Cruz',
                    'email' => 'juan.bulk.student@example.com',
                    'program' => 'BSIT',
                    'password' => 'StrongPass123',
                ],
            ],
        ]);

    $response->assertRedirect(route('admin.users.students'));

    $this->assertDatabaseHas('users', [
        'email' => 'juan.bulk.student@example.com',
        'role' => 'student',
        'status' => 'active',
    ]);

    $student = User::query()->where('email', 'juan.bulk.student@example.com')->firstOrFail();

    $this->assertDatabaseHas('student_program', [
        'student_id' => $student->id,
        'program' => 'BSIT',
    ]);
});

it('imports faculty rows when type is sent in the request payload', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $admin = User::factory()->create([
        'email' => 'admin-bulk-upload-2@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $response = $this
        ->withSession(['active_role' => 'admin'])
        ->actingAs($admin, 'web')
        ->post(route('admin.users.bulk-store'), [
            'type' => 'faculty',
            'rows' => [
                [
                    'first_name' => 'Maria',
                    'last_name' => 'Santos',
                    'email' => 'maria.bulk.faculty@example.com',
                    'roles' => ['adviser', 'panelist'],
                    'password' => 'StrongPass123',
                ],
            ],
        ]);

    $response->assertRedirect(route('admin.users.faculty'));

    $faculty = User::query()->where('email', 'maria.bulk.faculty@example.com')->firstOrFail();

    expect($faculty->role)->toBe('adviser');
    expect($faculty->roleSlugs())
        ->toContain('adviser')
        ->toContain('panelist');
});

it('uses the query type when payload type is stale during bulk import', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $admin = User::factory()->create([
        'email' => 'admin-bulk-upload-3@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $response = $this
        ->withSession(['active_role' => 'admin'])
        ->actingAs($admin, 'web')
        ->post(route('admin.users.bulk-store', ['type' => 'student']), [
            'type' => 'user',
            'rows' => [
                [
                    'first_name' => 'Andrea',
                    'last_name' => 'Ramos',
                    'email' => 'andrea.bulk.student@example.com',
                    'program' => 'BSIS',
                    'password' => 'StrongPass123',
                ],
            ],
        ]);

    $response->assertRedirect(route('admin.users.students'));

    $this->assertDatabaseHas('users', [
        'email' => 'andrea.bulk.student@example.com',
        'role' => 'student',
        'status' => 'active',
    ]);

    $student = User::query()->where('email', 'andrea.bulk.student@example.com')->firstOrFail();

    $this->assertDatabaseHas('student_program', [
        'student_id' => $student->id,
        'program' => 'BSIS',
    ]);
});

it('queues bulk import jobs and returns progress payload for json requests', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);
    Queue::fake();

    $admin = User::factory()->create([
        'email' => 'admin-bulk-upload-queue@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $response = $this
        ->withSession(['active_role' => 'admin'])
        ->actingAs($admin, 'web')
        ->postJson(route('admin.users.bulk-store', ['type' => 'student']), [
            'type' => 'student',
            'rows' => [
                [
                    'first_name' => 'Queued',
                    'last_name' => 'Student',
                    'email' => 'queued.student@example.com',
                    'program' => 'BSIT',
                    'password' => 'StrongPass123',
                ],
            ],
        ]);

    $response
        ->assertStatus(202)
        ->assertJsonPath('status', 'queued')
        ->assertJsonPath('total_rows', 1)
        ->assertJsonPath('processed_rows', 0);

    $importId = $response->json('import_id');

    expect($importId)->toBeString()->not->toBe('');

    Queue::assertPushed(ProcessBulkUserImport::class, function (ProcessBulkUserImport $job) use ($importId): bool {
        return $job->importId === $importId
            && $job->requestedById !== null
            && $job->entityType === 'student'
            && count($job->rows) === 1;
    });
});

it('returns bulk import status from cache for the requesting admin', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $admin = User::factory()->create([
        'email' => 'admin-bulk-upload-status@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $importId = (string) Str::uuid();

    Cache::put('bulk_user_import:'.$importId, [
        'import_id' => $importId,
        'requested_by' => $admin->id,
        'type' => 'student',
        'status' => 'processing',
        'total_rows' => 10,
        'processed_rows' => 4,
        'successful_rows' => 4,
        'failed_rows' => 0,
        'progress_percentage' => 40,
        'message' => 'Processed 4 of 10 rows.',
        'failed_items' => [],
        'started_at' => now()->subMinute()->toIso8601String(),
        'finished_at' => null,
        'updated_at' => now()->toIso8601String(),
    ], now()->addMinutes(5));

    $response = $this
        ->withSession(['active_role' => 'admin'])
        ->actingAs($admin, 'web')
        ->getJson(route('admin.users.bulk-status', ['importId' => $importId]));

    $response
        ->assertOk()
        ->assertJsonPath('import_id', $importId)
        ->assertJsonPath('status', 'processing')
        ->assertJsonPath('progress_percentage', 40);
});

it('cancels a queued bulk import for the requesting admin', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $admin = User::factory()->create([
        'email' => 'admin-bulk-upload-cancel@example.com',
        'password' => 'admin-pass-123',
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->syncRoles(['admin']);

    $importId = (string) Str::uuid();

    Cache::put('bulk_user_import:'.$importId, [
        'import_id' => $importId,
        'requested_by' => $admin->id,
        'type' => 'student',
        'status' => 'queued',
        'total_rows' => 10,
        'processed_rows' => 0,
        'successful_rows' => 0,
        'failed_rows' => 0,
        'progress_percentage' => 0,
        'message' => 'Import queued. Processing in the background...',
        'failed_items' => [],
        'cancel_requested' => false,
        'started_at' => null,
        'finished_at' => null,
        'updated_at' => now()->toIso8601String(),
    ], now()->addMinutes(5));

    $response = $this
        ->withSession(['active_role' => 'admin'])
        ->actingAs($admin, 'web')
        ->postJson(route('admin.users.bulk-cancel', ['importId' => $importId]));

    $response
        ->assertOk()
        ->assertJsonPath('status', 'cancelled')
        ->assertJsonPath('cancel_requested', true);

    $progress = Cache::get('bulk_user_import:'.$importId);

    expect($progress)->toBeArray();
    expect($progress['status'])->toBe('cancelled');
    expect($progress['cancel_requested'])->toBeTrue();
});

it('does not process rows when a cancellation request exists before job start', function (): void {
    $importId = (string) Str::uuid();

    Cache::put('bulk_user_import:'.$importId, [
        'import_id' => $importId,
        'requested_by' => null,
        'type' => 'student',
        'status' => 'queued',
        'total_rows' => 1,
        'processed_rows' => 0,
        'successful_rows' => 0,
        'failed_rows' => 0,
        'progress_percentage' => 0,
        'message' => 'Import queued.',
        'failed_items' => [],
        'cancel_requested' => true,
        'started_at' => null,
        'finished_at' => null,
        'updated_at' => now()->toIso8601String(),
    ], now()->addMinutes(5));

    $job = new ProcessBulkUserImport(
        importId: $importId,
        requestedById: null,
        entityType: 'student',
        rows: [
            [
                'first_name' => 'Cancelled',
                'last_name' => 'Row',
                'email' => 'cancelled.row@example.com',
                'program' => 'BSIT',
                'password' => 'StrongPass123',
            ],
        ]
    );

    $job->handle();

    $this->assertDatabaseMissing('users', [
        'email' => 'cancelled.row@example.com',
    ]);

    $progress = Cache::get('bulk_user_import:'.$importId);

    expect($progress)->toBeArray();
    expect($progress['status'])->toBe('cancelled');
    expect($progress['processed_rows'])->toBe(0);
});
