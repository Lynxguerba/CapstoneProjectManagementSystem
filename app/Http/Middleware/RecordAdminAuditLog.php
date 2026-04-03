<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class RecordAdminAuditLog
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $routeName = $request->route()?->getName();
        $user = $request->user();
        $writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        $excludedRoutes = ['login.store', 'logout', 'switch-role'];
        $shouldRecord = $user instanceof User
            && in_array($request->method(), $writeMethods, true)
            && ! in_array((string) $routeName, $excludedRoutes, true)
            && $request->path() !== 'switch-role';

        if (! $shouldRecord || ! Schema::hasTable('audit_logs')) {
            return $response;
        }

        $statusCode = $response->getStatusCode();

        try {
            AuditLog::query()->create([
                'user_id' => $user?->id,
                'actor_name' => $this->resolveActorName($user),
                'action' => $this->resolveActionLabel($request, $routeName),
                'entity' => $this->resolveEntityLabel($request, $routeName),
                'severity' => $this->resolveSeverity($request->method(), $statusCode),
                'route_name' => $routeName,
                'http_method' => $request->method(),
                'status_code' => $statusCode,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => $this->resolveDescription($request, $statusCode),
                'metadata' => [
                    'path' => $request->path(),
                    'query' => $request->query(),
                    'input_keys' => array_keys($request->except(['password', 'password_confirmation', 'current_password'])),
                ],
            ]);
        } catch (\Throwable $e) {
            return $response;
        }

        return $response;
    }

    private function resolveActorName(?User $user): string
    {
        if (! $user) {
            return 'System';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = $firstName !== '' || $lastName !== ''
            ? trim($firstName.' '.$lastName)
            : (is_string($user->name) ? trim($user->name) : '');

        return $fullName !== '' ? $fullName : 'System';
    }

    private function resolveActionLabel(Request $request, ?string $routeName): string
    {
        $operation = match ($request->method()) {
            'POST' => 'Create',
            'PUT', 'PATCH' => 'Update',
            'DELETE' => 'Delete',
            default => 'Execute',
        };

        if (! is_string($routeName) || $routeName === '') {
            return $operation.' '.str($request->path())->replace('/', ' ')->headline()->toString();
        }

        $routeLabel = str($routeName)
            ->after('admin.')
            ->replace('.', ' ')
            ->replace('_', ' ')
            ->headline()
            ->toString();

        return trim($operation.' '.$routeLabel);
    }

    private function resolveEntityLabel(Request $request, ?string $routeName): string
    {
        if (is_string($routeName) && $routeName !== '') {
            $entity = str($routeName)->after('admin.')->beforeLast('.');

            if ($entity->value() !== '') {
                return $entity->replace(['.', '_'], ' ')->headline()->toString();
            }
        }

        return str($request->segment(2) ?? 'admin')->replace(['-', '_'], ' ')->headline()->toString();
    }

    private function resolveSeverity(string $method, int $statusCode): string
    {
        if ($statusCode >= 500) {
            return 'critical';
        }

        if ($statusCode >= 400) {
            return 'warning';
        }

        if ($method === 'DELETE') {
            return 'critical';
        }

        if (in_array($method, ['PUT', 'PATCH'], true)) {
            return 'warning';
        }

        return 'info';
    }

    private function resolveDescription(Request $request, int $statusCode): string
    {
        return sprintf(
            '%s %s completed with status %d',
            $request->method(),
            $request->path(),
            $statusCode,
        );
    }
}
