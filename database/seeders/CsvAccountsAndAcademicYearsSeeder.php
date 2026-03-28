<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Role;
use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CsvAccountsAndAcademicYearsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedAcademicYears();

        $this->seedFacultyAccounts(
            base_path('concept/Accounts/CPMS Examples Record - Faculties.csv')
        );

        $this->seedStudentAccounts(
            base_path('concept/Accounts/CPMS Examples Record - BSIS-A-25-26.csv'),
            'BSIS'
        );

        $this->seedStudentAccounts(
            base_path('concept/Accounts/CPMS Examples Record - BSIT-A-25-26.csv'),
            'BSIT'
        );
    }

    private function seedAcademicYears(): void
    {
        $academicYears = [
            ['start_year' => 2023, 'end_year' => 2024, 'label' => '2023-2024', 'is_current' => false],
            ['start_year' => 2024, 'end_year' => 2025, 'label' => '2024-2025', 'is_current' => false],
            ['start_year' => 2025, 'end_year' => 2026, 'label' => '2025-2026', 'is_current' => true],
        ];

        foreach ($academicYears as $academicYear) {
            AcademicYear::query()->updateOrCreate(
                [
                    'start_year' => $academicYear['start_year'],
                    'end_year' => $academicYear['end_year'],
                ],
                [
                    'label' => $academicYear['label'],
                    'is_current' => $academicYear['is_current'],
                ],
            );
        }
    }

    private function seedFacultyAccounts(string $csvPath): void
    {
        $rows = $this->readCsvRows($csvPath);

        foreach ($rows as $row) {
            $email = $this->normalizeEmail((string) ($row['email_address'] ?? ''));

            if ($email === '') {
                continue;
            }

            $firstName = $this->sanitizeValue((string) ($row['first_name'] ?? ''));
            $lastName = $this->sanitizeValue((string) ($row['last_name'] ?? ''));
            $password = $this->sanitizeValue((string) ($row['id_number'] ?? 'password'));
            $roles = $this->resolveRoleSlugs((string) ($row['roles'] ?? ''));

            if (count($roles) === 0) {
                $roles = ['panelist'];
            }

            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => trim($firstName.' '.$lastName),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'password' => $password !== '' ? $password : 'password',
                    'role' => $roles[0],
                    'status' => 'active',
                    'program' => null,
                ],
            );

            $user->syncRoles($roles);
            $user->studentProgram()->delete();
        }
    }

    private function seedStudentAccounts(string $csvPath, string $fallbackProgram): void
    {
        $rows = $this->readCsvRows($csvPath);

        foreach ($rows as $row) {
            $email = $this->normalizeEmail((string) ($row['email'] ?? ''));

            if ($email === '') {
                continue;
            }

            $firstName = $this->sanitizeValue((string) ($row['first_name'] ?? ''));
            $lastName = $this->sanitizeValue((string) ($row['last_name'] ?? ''));
            $password = $this->sanitizeValue((string) ($row['password'] ?? 'password'));
            $program = $this->normalizeProgram((string) ($row['program'] ?? ''), $fallbackProgram);

            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => trim($firstName.' '.$lastName),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'password' => $password !== '' ? $password : 'password',
                    'role' => 'student',
                    'status' => 'active',
                    'program' => $program,
                ],
            );

            $user->syncRoles(['student']);

            StudentProgram::query()->updateOrCreate(
                ['student_id' => $user->id],
                ['program' => $program],
            );
        }
    }

    /**
     * @return Collection<int, array<string, string>>
     */
    private function readCsvRows(string $csvPath): Collection
    {
        if (! File::exists($csvPath)) {
            return collect();
        }

        $fileHandle = fopen($csvPath, 'r');

        if (! is_resource($fileHandle)) {
            return collect();
        }

        $headers = fgetcsv($fileHandle);

        if (! is_array($headers)) {
            fclose($fileHandle);

            return collect();
        }

        $normalizedHeaders = collect($headers)
            ->map(fn (string $header): string => $this->normalizeHeader($header))
            ->values()
            ->all();

        $rows = collect();

        while (($row = fgetcsv($fileHandle)) !== false) {
            if (! is_array($row)) {
                continue;
            }

            $record = [];

            foreach ($normalizedHeaders as $index => $header) {
                if ($header === '') {
                    continue;
                }

                $record[$header] = $this->sanitizeValue((string) ($row[$index] ?? ''));
            }

            $hasAnyValue = collect($record)->contains(
                fn (string $value): bool => $value !== ''
            );

            if (! $hasAnyValue) {
                continue;
            }

            $rows->push($record);
        }

        fclose($fileHandle);

        return $rows;
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)
            ->replace("\xEF\xBB\xBF", '')
            ->trim()
            ->lower()
            ->replace([' ', '-', '/'], '_')
            ->replace('__', '_')
            ->trim('_')
            ->value();
    }

    private function sanitizeValue(string $value): string
    {
        return trim($value);
    }

    private function normalizeEmail(string $email): string
    {
        $normalizedEmail = Str::of($email)->trim()->lower()->value();

        return filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL) ? $normalizedEmail : '';
    }

    private function normalizeProgram(string $program, string $fallbackProgram): string
    {
        $normalizedProgram = strtoupper(trim($program));

        if (in_array($normalizedProgram, ['BSIT', 'BSIS'], true)) {
            return $normalizedProgram;
        }

        return strtoupper($fallbackProgram) === 'BSIS' ? 'BSIS' : 'BSIT';
    }

    /**
     * @return array<int, string>
     */
    private function resolveRoleSlugs(string $roles): array
    {
        return collect(explode(',', $roles))
            ->map(fn (string $role): string => trim($role))
            ->filter(fn (string $role): bool => $role !== '')
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
