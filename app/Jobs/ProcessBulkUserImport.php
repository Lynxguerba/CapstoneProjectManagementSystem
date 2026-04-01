<?php

namespace App\Jobs;

use App\Models\Role;
use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ProcessBulkUserImport implements ShouldQueue
{
    use Queueable;

    public int $timeout = 3600;

    public int $tries = 1;

    /**
     * Create a new job instance.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function __construct(
        public string $importId,
        public ?int $requestedById,
        public string $entityType,
        public array $rows
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (function_exists('set_time_limit')) {
            set_time_limit(0);
        }

        $totalRows = count($this->rows);
        $hasStudentProgramTable = Schema::hasTable('student_program');
        $roleIdsBySlug = $this->roleIdsBySlug();
        $failedItems = [];
        $processedRows = 0;
        $successfulRows = 0;
        $failedRows = 0;

        if ($this->isCancellationRequested()) {
            $this->writeProgress(
                status: 'cancelled',
                totalRows: $totalRows,
                processedRows: 0,
                successfulRows: 0,
                failedRows: 0,
                message: 'Import cancelled before processing started.',
                failedItems: [],
                startedAt: null,
                finishedAt: now()->toIso8601String()
            );

            return;
        }

        $this->writeProgress(
            status: 'processing',
            totalRows: $totalRows,
            processedRows: 0,
            successfulRows: 0,
            failedRows: 0,
            message: $totalRows > 0 ? 'Import started.' : 'No rows to import.',
            failedItems: [],
            startedAt: now()->toIso8601String(),
            finishedAt: null
        );

        foreach ($this->rows as $index => $row) {
            if ($this->isCancellationRequested()) {
                $this->writeProgress(
                    status: 'cancelled',
                    totalRows: $totalRows,
                    processedRows: $processedRows,
                    successfulRows: $successfulRows,
                    failedRows: $failedRows,
                    message: $processedRows > 0
                        ? "Import cancelled after processing {$processedRows} row(s)."
                        : 'Import cancelled before processing started.',
                    failedItems: $failedItems,
                    startedAt: null,
                    finishedAt: now()->toIso8601String()
                );

                return;
            }

            $rowNumber = $index + 1;
            $email = is_string($row['email'] ?? null) ? strtolower(trim((string) $row['email'])) : null;

            try {
                $this->importRow($row, $roleIdsBySlug, $hasStudentProgramTable);
                $successfulRows++;
            } catch (Throwable $throwable) {
                report($throwable);
                $failedRows++;
                $failedItems[] = [
                    'line' => $rowNumber,
                    'email' => $email,
                    'message' => $this->resolveFailureMessage($throwable),
                ];
            }

            $processedRows++;

            $this->writeProgress(
                status: 'processing',
                totalRows: $totalRows,
                processedRows: $processedRows,
                successfulRows: $successfulRows,
                failedRows: $failedRows,
                message: "Processed {$processedRows} of {$totalRows} rows.",
                failedItems: $failedItems,
                startedAt: null,
                finishedAt: null
            );
        }

        $this->writeProgress(
            status: 'completed',
            totalRows: $totalRows,
            processedRows: $processedRows,
            successfulRows: $successfulRows,
            failedRows: $failedRows,
            message: $failedRows > 0
                ? "Import completed with {$failedRows} failed row(s)."
                : 'Import completed successfully.',
            failedItems: $failedItems,
            startedAt: null,
            finishedAt: now()->toIso8601String()
        );
    }

    public function failed(Throwable $throwable): void
    {
        $existingProgress = Cache::get($this->cacheKey());

        if (! is_array($existingProgress)) {
            $existingProgress = $this->initialProgress();
        }

        $existingProgress['status'] = 'failed';
        $existingProgress['message'] = $this->resolveFailureMessage($throwable);
        $existingProgress['finished_at'] = now()->toIso8601String();
        $existingProgress['updated_at'] = now()->toIso8601String();

        Cache::put($this->cacheKey(), $existingProgress, now()->addHours(12));
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, int>  $roleIdsBySlug
     */
    private function importRow(array $row, array $roleIdsBySlug, bool $hasStudentProgramTable): void
    {
        DB::transaction(function () use ($row, $roleIdsBySlug, $hasStudentProgramTable): void {
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $lastName = trim((string) ($row['last_name'] ?? ''));
            $email = strtolower(trim((string) ($row['email'] ?? '')));
            $password = (string) ($row['password'] ?? '');
            $name = trim($firstName.' '.$lastName);

            if ($this->entityType === 'student') {
                $user = User::query()->create([
                    'name' => $name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'role' => 'student',
                    'status' => 'active',
                    'password' => $password,
                ]);

                $this->attachRoles($user, ['student'], $roleIdsBySlug);
                $this->syncStudentProfile($user, $row['program'] ?? null, true, $hasStudentProgramTable);

                return;
            }

            if ($this->entityType === 'faculty') {
                $roles = collect($row['roles'] ?? [])
                    ->map(fn (mixed $role): ?string => is_string($role) ? Role::normalizeRole($role) : null)
                    ->filter(fn (?string $role): bool => is_string($role) && $this->isFacultyAssignableRole($role))
                    ->values()
                    ->all();
                $activeRole = $roles[0] ?? 'adviser';

                $user = User::query()->create([
                    'name' => $name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'role' => $activeRole,
                    'status' => 'active',
                    'password' => $password,
                ]);

                $this->attachRoles($user, $roles !== [] ? $roles : [$activeRole], $roleIdsBySlug);

                return;
            }

            $roles = collect($row['roles'] ?? [])
                ->map(fn (mixed $role): ?string => is_string($role) ? Role::normalizeRole($role) : null)
                ->filter(fn (?string $role): bool => is_string($role))
                ->values()
                ->all();
            $activeRole = $roles[0] ?? 'student';
            $resolvedRoles = $roles !== [] ? $roles : [$activeRole];

            $user = User::query()->create([
                'name' => $name,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'role' => $activeRole,
                'status' => 'active',
                'password' => $password,
            ]);

            $this->attachRoles($user, $resolvedRoles, $roleIdsBySlug);
            $this->syncStudentProfile(
                $user,
                $row['program'] ?? null,
                in_array('student', $resolvedRoles, true),
                $hasStudentProgramTable
            );
        });
    }

    /**
     * @param  array<int, string>  $roles
     * @param  array<string, int>  $roleIdsBySlug
     */
    private function attachRoles(User $user, array $roles, array $roleIdsBySlug): void
    {
        $roleIds = collect($roles)
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter(fn (?string $role): bool => is_string($role) && array_key_exists($role, $roleIdsBySlug))
            ->values()
            ->unique()
            ->map(fn (string $role): int => $roleIdsBySlug[$role])
            ->all();

        if (count($roleIds) > 0) {
            $user->roles()->sync($roleIds);

            return;
        }

        $user->syncRoles($roles);
    }

    private function syncStudentProfile(User $user, mixed $programCode, bool $isStudent, bool $hasStudentProgramTable): void
    {
        if (! $hasStudentProgramTable) {
            return;
        }

        if (! $isStudent) {
            $user->studentProgram()->delete();

            return;
        }

        $resolvedProgram = $this->normalizeProgramCode($programCode);

        if ($resolvedProgram === null) {
            $user->studentProgram()->delete();

            return;
        }

        StudentProgram::query()->updateOrCreate(
            ['student_id' => $user->id],
            ['program' => $resolvedProgram]
        );
    }

    private function normalizeProgramCode(mixed $programCode): ?string
    {
        if (! is_string($programCode) || trim($programCode) === '') {
            return null;
        }

        $normalizedCode = strtoupper(trim($programCode));

        return in_array($normalizedCode, ['BSIT', 'BSIS'], true) ? $normalizedCode : null;
    }

    private function isFacultyAssignableRole(string $role): bool
    {
        return in_array($role, [
            'admin',
            'adviser',
            'panelist',
            'instructor',
            'dean',
            'program_chairperson',
        ], true);
    }

    /**
     * @return array<string, int>
     */
    private function roleIdsBySlug(): array
    {
        return Role::query()
            ->pluck('id', 'slug')
            ->mapWithKeys(fn (mixed $id, mixed $slug): array => [(string) $slug => (int) $id])
            ->all();
    }

    private function resolveFailureMessage(Throwable $throwable): string
    {
        if ($throwable instanceof QueryException && $this->isDuplicateEmailConstraintViolation($throwable)) {
            return 'Email already exists.';
        }

        return 'Failed to import this row.';
    }

    private function isDuplicateEmailConstraintViolation(QueryException $queryException): bool
    {
        $errorInfo = $queryException->errorInfo;

        if (is_array($errorInfo) && isset($errorInfo[0]) && (string) $errorInfo[0] === '23000') {
            return true;
        }

        return str_contains(strtolower($queryException->getMessage()), 'duplicate');
    }

    /**
     * @param  array<int, array{line: int, email: ?string, message: string}>  $failedItems
     */
    private function writeProgress(
        string $status,
        int $totalRows,
        int $processedRows,
        int $successfulRows,
        int $failedRows,
        string $message,
        array $failedItems,
        ?string $startedAt,
        ?string $finishedAt
    ): void {
        $existingProgress = Cache::get($this->cacheKey());

        if (! is_array($existingProgress)) {
            $existingProgress = $this->initialProgress();
        }

        if ($startedAt !== null) {
            $existingProgress['started_at'] = $startedAt;
        }

        if ($finishedAt !== null) {
            $existingProgress['finished_at'] = $finishedAt;
        }

        $existingProgress['status'] = $status;
        $existingProgress['total_rows'] = $totalRows;
        $existingProgress['processed_rows'] = $processedRows;
        $existingProgress['successful_rows'] = $successfulRows;
        $existingProgress['failed_rows'] = $failedRows;
        $existingProgress['progress_percentage'] = $this->calculateProgressPercentage($totalRows, $processedRows, $status);
        $existingProgress['message'] = $message;
        $existingProgress['failed_items'] = array_slice($failedItems, -50);
        $existingProgress['updated_at'] = now()->toIso8601String();

        Cache::put($this->cacheKey(), $existingProgress, now()->addHours(12));
    }

    private function calculateProgressPercentage(int $totalRows, int $processedRows, string $status): int
    {
        if ($totalRows <= 0) {
            return $status === 'completed' ? 100 : 0;
        }

        if ($status === 'completed') {
            return 100;
        }

        return (int) min(99, max(0, floor(($processedRows / $totalRows) * 100)));
    }

    /**
     * @return array<string, mixed>
     */
    private function initialProgress(): array
    {
        return [
            'import_id' => $this->importId,
            'requested_by' => $this->requestedById,
            'type' => $this->entityType,
            'status' => 'queued',
            'total_rows' => count($this->rows),
            'processed_rows' => 0,
            'successful_rows' => 0,
            'failed_rows' => 0,
            'progress_percentage' => 0,
            'message' => 'Import queued.',
            'failed_items' => [],
            'cancel_requested' => false,
            'started_at' => null,
            'finished_at' => null,
            'updated_at' => now()->toIso8601String(),
        ];
    }

    private function isCancellationRequested(): bool
    {
        $progress = Cache::get($this->cacheKey());

        if (! is_array($progress)) {
            return false;
        }

        return (bool) ($progress['cancel_requested'] ?? false);
    }

    private function cacheKey(): string
    {
        return 'bulk_user_import:'.$this->importId;
    }
}
