<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuditLogController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'severity' => $request->string('severity')->toString(),
        ];

        $logs = [];
        $pagination = [
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 15,
            'total' => 0,
        ];

        if (Schema::hasTable('audit_logs')) {
            try {
                $logsQuery = AuditLog::query()
                    ->with('user:id,name,first_name,last_name')
                    ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                        $term = $filters['search'];

                        $query->where(function (Builder $innerQuery) use ($term): void {
                            $innerQuery
                                ->where('actor_name', 'like', '%'.$term.'%')
                                ->orWhere('action', 'like', '%'.$term.'%')
                                ->orWhere('entity', 'like', '%'.$term.'%')
                                ->orWhere('description', 'like', '%'.$term.'%')
                                ->orWhereHas('user', function (Builder $userQuery) use ($term): void {
                                    $userQuery
                                        ->where('first_name', 'like', '%'.$term.'%')
                                        ->orWhere('last_name', 'like', '%'.$term.'%')
                                        ->orWhere('name', 'like', '%'.$term.'%');
                                });
                        });
                    })
                    ->when(in_array($filters['severity'], ['info', 'warning', 'critical'], true), function (Builder $query) use ($filters): void {
                        $query->where('severity', $filters['severity']);
                    })
                    ->orderByDesc('created_at');

                $paginator = $logsQuery->paginate(15)->withQueryString();

                $logs = $paginator
                    ->getCollection()
                    ->map(fn (AuditLog $log): array => [
                        'id' => $log->id,
                        'actor' => $this->resolveActorName($log->user, $log->actor_name),
                        'action' => $log->action,
                        'entity' => $log->entity ?? 'System',
                        'timestamp' => $log->created_at?->format('Y-m-d H:i:s') ?? '',
                        'severity' => $this->normalizeSeverity($log->severity),
                        'description' => $log->description,
                    ])
                    ->values()
                    ->all();

                $pagination = [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ];
            } catch (\Throwable $e) {
                $logs = [];
            }
        }

        return Inertia::render('Admin/audit-logs', [
            'logs' => $logs,
            'filters' => [
                'search' => $filters['search'],
                'severity' => in_array($filters['severity'], ['info', 'warning', 'critical'], true) ? $filters['severity'] : 'all',
            ],
            'pagination' => $pagination,
        ]);
    }

    private function resolveActorName(?User $user, ?string $fallback): string
    {
        if ($user) {
            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? trim($user->name) : '');

            if ($fullName !== '') {
                return $fullName;
            }
        }

        if (is_string($fallback) && trim($fallback) !== '') {
            return trim($fallback);
        }

        return 'System';
    }

    private function normalizeSeverity(?string $severity): string
    {
        if (in_array($severity, ['info', 'warning', 'critical'], true)) {
            return $severity;
        }

        return 'info';
    }
}
