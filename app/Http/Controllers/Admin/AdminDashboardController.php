<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const ROLE_VISUALS = [
        'student' => ['label' => 'Students', 'color' => '#16a34a'],
        'adviser' => ['label' => 'Advisers', 'color' => '#4f46e5'],
        'instructor' => ['label' => 'Instructors', 'color' => '#0891b2'],
        'panelist' => ['label' => 'Panelists', 'color' => '#f59e0b'],
        'dean' => ['label' => 'Deans', 'color' => '#dc2626'],
        'admin' => ['label' => 'Admins', 'color' => '#334155'],
        'program_chairperson' => ['label' => 'Program Chairpersons', 'color' => '#7c3aed'],
    ];

    public function __invoke(): Response
    {
        $totalUsers = User::query()->count();

        /** @var Collection<string, int|string> $roleCounts */
        $roleCounts = User::query()
            ->selectRaw('role, COUNT(*) as aggregate')
            ->whereNotNull('role')
            ->groupBy('role')
            ->pluck('aggregate', 'role');

        $roleDistribution = collect(self::ROLE_VISUALS)
            ->map(function (array $visual, string $role) use ($roleCounts): array {
                return [
                    'label' => $visual['label'],
                    'value' => (int) ($roleCounts->get($role, 0)),
                    'color' => $visual['color'],
                ];
            })
            ->filter(fn (array $item): bool => $item['value'] > 0)
            ->values()
            ->all();

        return Inertia::render('Admin/dashboard', [
            'stats' => [
                'totalUsers' => $totalUsers,
                'activeGroups' => 0,
                'pendingTitleApprovals' => 0,
                'upcomingDefenses' => 0,
            ],
            'roleDistribution' => $roleDistribution,
        ]);
    }
}
