<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;

class AuditLogsPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $usersByEmail = User::query()
            ->whereIn('email', [
                'admin@dnsc.ic.ph',
                'adviser@dnsc.ic.ph',
                'instructor@dnsc.ic.ph',
                'panelist@dnsc.ic.ph',
                'dean@dnsc.ic.ph',
            ])
            ->get()
            ->keyBy('email');

        $templates = [
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Create User Management',
                'entity' => 'Users',
                'route_name' => 'admin.users.store',
                'http_method' => 'POST',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Update User Management',
                'entity' => 'Users',
                'route_name' => 'admin.users.update',
                'http_method' => 'PATCH',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Delete User Management',
                'entity' => 'Users',
                'route_name' => 'admin.users.destroy',
                'http_method' => 'DELETE',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Update System Settings',
                'entity' => 'System Settings',
                'route_name' => 'admin.system-settings.update',
                'http_method' => 'PUT',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Create Monitoring Scheduling',
                'entity' => 'Monitoring Scheduling',
                'route_name' => 'admin.monitoring.scheduling.store',
                'http_method' => 'POST',
            ],
            [
                'email' => 'instructor@dnsc.ic.ph',
                'action' => 'Update Group Assignment',
                'entity' => 'Groups',
                'route_name' => 'instructor.groups.update',
                'http_method' => 'PUT',
            ],
            [
                'email' => 'adviser@dnsc.ic.ph',
                'action' => 'Create Adviser Feedback',
                'entity' => 'Adviser Review',
                'route_name' => 'adviser.feedback.store',
                'http_method' => 'POST',
            ],
            [
                'email' => 'panelist@dnsc.ic.ph',
                'action' => 'Update Panel Evaluation',
                'entity' => 'Defense Evaluation',
                'route_name' => 'panelist.evaluations.update',
                'http_method' => 'PATCH',
            ],
            [
                'email' => 'dean@dnsc.ic.ph',
                'action' => 'Approve Program Submission',
                'entity' => 'Program Submissions',
                'route_name' => 'dean.submissions.approve',
                'http_method' => 'POST',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Update Defense Schedule',
                'entity' => 'Defense Schedules',
                'route_name' => 'admin.monitoring.scheduling.update',
                'http_method' => 'PATCH',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Delete Defense Schedule',
                'entity' => 'Defense Schedules',
                'route_name' => 'admin.monitoring.scheduling.destroy',
                'http_method' => 'DELETE',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Archive Project Repository',
                'entity' => 'Project Repository',
                'route_name' => 'admin.repository.archive',
                'http_method' => 'PATCH',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Export Project Repository',
                'entity' => 'Project Repository',
                'route_name' => 'admin.repository.export',
                'http_method' => 'GET',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Update Academic Year Setup',
                'entity' => 'Academic Years',
                'route_name' => 'admin.system-settings.update',
                'http_method' => 'PUT',
            ],
            [
                'email' => 'admin@dnsc.ic.ph',
                'action' => 'Failed Bulk User Import',
                'entity' => 'Users',
                'route_name' => 'admin.users.bulk.store',
                'http_method' => 'POST',
            ],
        ];

        $recordCount = 84;
        $severityPool = $this->buildSeverityPool($recordCount);
        $templateCount = count($templates);

        for ($index = 0; $index < $recordCount; $index++) {
            $template = $templates[$index % $templateCount];
            $email = (string) $template['email'];
            $user = $usersByEmail->get($email);
            $severity = (string) $severityPool[$index];
            $method = (string) $template['http_method'];
            $routeName = (string) $template['route_name'];
            $statusCode = $this->resolveStatusCode($severity, $method);
            $timestamp = $this->resolveTimestampForRow($index, $recordCount);

            $actorName = $this->resolveActorName($user);

            AuditLog::query()->updateOrCreate(
                [
                    'action' => (string) $template['action'],
                    'route_name' => $routeName,
                    'created_at' => $timestamp,
                ],
                [
                    'user_id' => $user?->id,
                    'actor_name' => $actorName,
                    'entity' => (string) $template['entity'],
                    'severity' => $severity,
                    'http_method' => $method,
                    'status_code' => $statusCode,
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Seeded AuditLogsPageSeeder',
                    'description' => $this->resolveDescription($method, $routeName, $statusCode),
                    'metadata' => [
                        'path' => 'seeded/audit-logs',
                        'seed_source' => 'AuditLogsPageSeeder',
                        'seed_index' => $index,
                    ],
                    'updated_at' => $timestamp,
                ],
            );
        }
    }

    /**
     * @return array<int, string>
     */
    private function buildSeverityPool(int $count): array
    {
        $pool = [];
        $levels = ['info', 'warning', 'critical'];

        for ($index = 0; $index < $count; $index++) {
            $pool[] = $levels[$index % count($levels)];
        }

        shuffle($pool);

        return $pool;
    }

    private function resolveTimestampForRow(int $index, int $recordCount): CarbonInterface
    {
        $daysInWindow = 7;
        $logsPerDay = max(1, intdiv($recordCount, $daysInWindow));
        $dayOffset = min($daysInWindow - 1, intdiv($index, $logsPerDay));
        $slotIndex = $index % $logsPerDay;

        $baseHour = 8 + ($slotIndex % 10);
        $hour = min(20, $baseHour);
        $minute = 5 + (($slotIndex * 11) % 50);
        $second = ($index * 13) % 60;

        return now()
            ->startOfDay()
            ->subDays(6)
            ->addDays($dayOffset)
            ->setTime($hour, $minute, $second);
    }

    private function resolveStatusCode(string $severity, string $method): int
    {
        if ($severity === 'critical') {
            return fake()->randomElement([409, 422, 500, 503]);
        }

        if ($severity === 'warning') {
            return fake()->randomElement([302, 400, 422, 429]);
        }

        if ($method === 'GET') {
            return 200;
        }

        return fake()->randomElement([200, 201, 302]);
    }

    private function resolveDescription(string $method, string $routeName, int $statusCode): string
    {
        return sprintf(
            '%s %s completed with status %d',
            $method,
            str_replace('.', '/', $routeName),
            $statusCode,
        );
    }

    private function resolveActorName(?User $user): string
    {
        if (! $user instanceof User) {
            return 'System';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        $displayName = is_string($user->name) ? trim($user->name) : '';

        return $displayName !== '' ? $displayName : 'System';
    }
}
