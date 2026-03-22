<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\GroupAdviserRequest;
use App\Models\ProgramSet;
use App\Models\StudentProgram;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const ROLE_VISUALS = [
        'student' => ['label' => 'Students', 'color' => '#16a34a'],
        'adviser' => ['label' => 'Advisers', 'color' => '#14b8a6'],
        'instructor' => ['label' => 'Instructors', 'color' => '#22c55e'],
        'panelist' => ['label' => 'Panelists', 'color' => '#65a30d'],
        'dean' => ['label' => 'Deans', 'color' => '#0f766e'],
        'admin' => ['label' => 'Admins', 'color' => '#047857'],
        'program_chairperson' => ['label' => 'Program Chairpersons', 'color' => '#15803d'],
    ];

    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const STUDENT_PROGRAM_VISUALS = [
        'BSIT' => ['label' => 'BSIT', 'color' => '#10b981'],
        'BSIS' => ['label' => 'BSIS', 'color' => '#22c55e'],
    ];

    public function __invoke(): Response
    {
        $hasUsersTable = Schema::hasTable('users');
        $hasRoleTables = Schema::hasTable('roles') && Schema::hasTable('role_user');
        $totalUsers = $hasUsersTable ? User::query()->count() : 0;

        $activeUsers = $totalUsers;
        $inactiveUsers = 0;

        if ($hasUsersTable && Schema::hasColumn('users', 'status')) {
            $activeUsers = User::query()
                ->where('status', 'active')
                ->count();
            $inactiveUsers = max(0, $totalUsers - $activeUsers);
        }

        $totalStudents = $hasUsersTable ? $this->countUsersWithRole('student', $hasRoleTables) : 0;
        $totalFaculty = $hasUsersTable
            ? $this->countUsersWithAnyRoles(
                ['admin', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'],
                $hasRoleTables,
            )
            : 0;

        $activeGroups = Schema::hasTable('groups') ? Group::query()->count() : 0;
        $groupsWithAdviser = Schema::hasTable('group_advisers')
            ? GroupAdviser::query()->distinct('group_id')->count('group_id')
            : 0;
        $groupsWithoutAdviser = max(0, $activeGroups - $groupsWithAdviser);

        $programSets = Schema::hasTable('program_sets') ? ProgramSet::query()->count() : 0;

        $upcomingDefenses = 0;
        if (Schema::hasTable('defense_schedules')) {
            $upcomingDefenses = DefenseSchedule::query()
                ->whereIn('status', ['Scheduled', 'Pending'])
                ->whereDate('scheduled_date', '>=', now()->toDateString())
                ->count();
        }

        $pendingAdviserRequests = 0;
        if (Schema::hasTable('group_adviser_requests')) {
            $pendingAdviserRequests = GroupAdviserRequest::query()
                ->where('request_type', GroupAdviserRequest::TYPE_REQUEST)
                ->where('status', GroupAdviserRequest::STATUS_PENDING)
                ->count();
        }

        $defenseRoomsTotal = 0;
        $defenseRoomsActive = 0;
        if (Schema::hasTable('defense_rooms')) {
            $defenseRoomsTotal = DefenseRoom::query()->count();
            $defenseRoomsActive = DefenseRoom::query()
                ->where('is_active', true)
                ->count();
        }

        return Inertia::render('Admin/dashboard', [
            'stats' => [
                'totalUsers' => $totalUsers,
                'activeGroups' => $activeGroups,
                'totalStudents' => $totalStudents,
                'totalFaculty' => $totalFaculty,
                'activeUsers' => $activeUsers,
                'inactiveUsers' => $inactiveUsers,
                'groupsWithAdviser' => $groupsWithAdviser,
                'groupsWithoutAdviser' => $groupsWithoutAdviser,
                'programSets' => $programSets,
                'upcomingDefenses' => $upcomingDefenses,
                'pendingAdviserRequests' => $pendingAdviserRequests,
                'defenseRoomsTotal' => $defenseRoomsTotal,
                'defenseRoomsActive' => $defenseRoomsActive,
            ],
            'roleDistribution' => $this->buildRoleDistribution($hasUsersTable, $hasRoleTables),
            'programDistribution' => $this->buildProgramDistribution($hasUsersTable, $hasRoleTables),
            'activityTrend' => $this->buildActivityTrend(Schema::hasTable('audit_logs')),
        ]);
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildRoleDistribution(bool $hasUsersTable, bool $hasRoleTables): array
    {
        if (! $hasUsersTable) {
            return [];
        }

        return collect(self::ROLE_VISUALS)
            ->map(function (array $visual, string $role) use ($hasRoleTables): array {
                return [
                    'label' => $visual['label'],
                    'value' => $this->countUsersWithRole($role, $hasRoleTables),
                    'color' => $visual['color'],
                ];
            })
            ->filter(fn (array $item): bool => $item['value'] > 0)
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildProgramDistribution(bool $hasUsersTable, bool $hasRoleTables): array
    {
        $programCounts = collect(array_fill_keys(array_keys(self::STUDENT_PROGRAM_VISUALS), 0));

        if (Schema::hasTable('student_program')) {
            $counts = StudentProgram::query()
                ->selectRaw('program, COUNT(*) as total')
                ->whereIn('program', $programCounts->keys()->all())
                ->groupBy('program')
                ->pluck('total', 'program');

            foreach ($programCounts->keys() as $program) {
                $programCounts[$program] = (int) ($counts->get($program, 0));
            }
        } elseif ($hasUsersTable && Schema::hasTable('program_sets') && Schema::hasTable('program_set_student')) {
            foreach ($programCounts->keys() as $program) {
                $programCounts[$program] = User::query()
                    ->where(function (Builder $query) use ($hasRoleTables): void {
                        if ($hasRoleTables) {
                            $query
                                ->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('slug', 'student'))
                                ->orWhere('role', 'like', '%student%');

                            return;
                        }

                        $query->where('role', 'like', '%student%');
                    })
                    ->whereHas('programSets', fn (Builder $query) => $query->where('program_sets.program', $program))
                    ->distinct('users.id')
                    ->count('users.id');
            }
        }

        return collect(self::STUDENT_PROGRAM_VISUALS)
            ->map(function (array $visual, string $program) use ($programCounts): array {
                return [
                    'label' => $visual['label'],
                    'value' => (int) ($programCounts->get($program, 0)),
                    'color' => $visual['color'],
                ];
            })
            ->values()
            ->all();
    }

    private function countUsersWithRole(string $role, bool $hasRoleTables): int
    {
        return User::query()
            ->where(function (Builder $query) use ($role, $hasRoleTables): void {
                if ($hasRoleTables) {
                    $query
                        ->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('slug', $role))
                        ->orWhere('role', 'like', '%'.$role.'%');

                    return;
                }

                $query->where('role', 'like', '%'.$role.'%');
            })
            ->count();
    }

    /**
     * @param  array<int, string>  $roles
     */
    private function countUsersWithAnyRoles(array $roles, bool $hasRoleTables): int
    {
        if (count($roles) === 0) {
            return 0;
        }

        return User::query()
            ->where(function (Builder $query) use ($roles, $hasRoleTables): void {
                foreach ($roles as $index => $role) {
                    $method = $index === 0 ? 'where' : 'orWhere';

                    $query->{$method}(function (Builder $roleScope) use ($role, $hasRoleTables): void {
                        if ($hasRoleTables) {
                            $roleScope
                                ->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('slug', $role))
                                ->orWhere('role', 'like', '%'.$role.'%');

                            return;
                        }

                        $roleScope->where('role', 'like', '%'.$role.'%');
                    });
                }
            })
            ->count();
    }

    /**
     * @return array{labels: array<int, string>, info: array<int, int>, warning: array<int, int>, critical: array<int, int>}
     */
    private function buildActivityTrend(bool $hasAuditLogsTable): array
    {
        $dayStarts = collect(range(6, 0))
            ->map(fn (int $offset) => now()->copy()->startOfDay()->subDays($offset));
        $windowStart = $dayStarts->first() ?? now()->copy()->startOfDay()->subDays(6);

        $auditCounts = collect();
        if ($hasAuditLogsTable && Schema::hasColumn('audit_logs', 'created_at') && Schema::hasColumn('audit_logs', 'severity')) {
            $auditCounts = AuditLog::query()
                ->selectRaw('DATE(created_at) as logged_on, severity, COUNT(*) as total')
                ->whereDate('created_at', '>=', $windowStart->toDateString())
                ->groupByRaw('DATE(created_at), severity')
                ->get()
                ->mapWithKeys(fn (object $row): array => [
                    (string) $row->logged_on.'|'.(string) $row->severity => (int) $row->total,
                ]);
        }

        $labels = $dayStarts
            ->map(fn ($day): string => $day->format('D'))
            ->values()
            ->all();
        $info = $dayStarts
            ->map(fn ($day): int => (int) $auditCounts->get($day->toDateString().'|info', 0))
            ->values()
            ->all();
        $warning = $dayStarts
            ->map(fn ($day): int => (int) $auditCounts->get($day->toDateString().'|warning', 0))
            ->values()
            ->all();
        $critical = $dayStarts
            ->map(fn ($day): int => (int) $auditCounts->get($day->toDateString().'|critical', 0))
            ->values()
            ->all();

        return [
            'labels' => $labels,
            'info' => $info,
            'warning' => $warning,
            'critical' => $critical,
        ];
    }
}
