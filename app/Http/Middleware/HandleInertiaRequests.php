<?php

namespace App\Http\Middleware;

use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $authUser = $request->user();
        $authUser?->loadMissing('roles:id,slug');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'academicYears' => static function (): array {
                try {
                    if (! Schema::hasTable('academic_years')) {
                        return [];
                    }

                    return AcademicYear::query()
                        ->orderByDesc('start_year')
                        ->orderByDesc('end_year')
                        ->limit(2)
                        ->get(['id', 'label', 'is_current'])
                        ->map(static fn (AcademicYear $academicYear): array => [
                            'id' => $academicYear->id,
                            'label' => $academicYear->label,
                            'is_current' => $academicYear->is_current,
                        ])
                        ->all();
                } catch (Throwable) {
                    return [];
                }
            },
            'auth' => [
                'user' => $authUser !== null
                    ? [
                        'id' => $authUser->id,
                        'name' => $authUser->name,
                        'email' => $authUser->email,
                        'role' => $authUser->role,
                        'roles' => $authUser->roleSlugs(),
                    ]
                    : null,
            ],
        ];
    }
}
