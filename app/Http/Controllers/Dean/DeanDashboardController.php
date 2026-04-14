<?php

namespace App\Http\Controllers\Dean;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupAdviser;
use App\Models\ProgramSet;
use App\Models\TitleCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DeanDashboardController extends Controller
{
    /**
     * @var array<int, string>
     */
    private array $deanProgramScope = ['BSIT', 'BSIS'];

    /**
     * @var array<string, array{label: string, color: string}>
     */
    private const PROGRAM_VISUALS = [
        'BSIT' => ['label' => 'BSIT', 'color' => '#047857'],
        'BSIS' => ['label' => 'BSIS', 'color' => '#65a30d'],
    ];

    public function __invoke(): Response
    {
        return Inertia::render('Dean/dashboard', [
            'stats' => $this->buildStats(),
            'programDistribution' => $this->buildProgramDistribution(),
            'programSetGroups' => $this->buildProgramSetApprovedGroupDistribution(),
            'approvalTrend' => $this->buildApprovalTrend(),
            'recentApprovals' => $this->buildRecentApprovals(),
        ]);
    }

    /**
     * @return array{
     *     approvedProjects: int,
     *     categories: int,
     *     programSets: int,
     *     groupsWithAdviser: int,
     *     groupsWithoutAdviser: int,
     * }
     */
    private function buildStats(): array
    {
        $approvedProjects = $this->countApprovedProjects();
        $groupsWithAdviser = $this->countApprovedGroupsWithAdviser();

        return [
            'approvedProjects' => $approvedProjects,
            'categories' => $this->countCategories(),
            'programSets' => $this->countProgramSets(),
            'groupsWithAdviser' => $groupsWithAdviser,
            'groupsWithoutAdviser' => max(0, $approvedProjects - $groupsWithAdviser),
        ];
    }

    private function countApprovedProjects(): int
    {
        if (! Schema::hasTable('groups') || ! Schema::hasTable('program_sets')) {
            return 0;
        }

        return Group::query()
            ->whereNotNull('approved_concept_submission_id')
            ->whereHas('programSet', fn (Builder $query): Builder => $query->whereIn('program', $this->deanProgramScope))
            ->count();
    }

    private function countCategories(): int
    {
        if (! Schema::hasTable('title_categories')) {
            return 0;
        }

        return TitleCategory::query()
            ->whereIn('program', $this->deanProgramScope)
            ->count();
    }

    private function countProgramSets(): int
    {
        if (! Schema::hasTable('program_sets')) {
            return 0;
        }

        return ProgramSet::query()
            ->whereIn('program', $this->deanProgramScope)
            ->count();
    }

    private function countApprovedGroupsWithAdviser(): int
    {
        if (! Schema::hasTable('group_advisers') || ! Schema::hasTable('groups') || ! Schema::hasTable('program_sets')) {
            return 0;
        }

        return GroupAdviser::query()
            ->join('groups', 'groups.id', '=', 'group_advisers.group_id')
            ->join('program_sets', 'program_sets.id', '=', 'groups.program_set_id')
            ->whereNotNull('groups.approved_concept_submission_id')
            ->whereIn('program_sets.program', $this->deanProgramScope)
            ->distinct('group_advisers.group_id')
            ->count('group_advisers.group_id');
    }

    /**
     * @return array<int, array{label: string, value: int, color: string}>
     */
    private function buildProgramDistribution(): array
    {
        $programCounts = collect(array_fill_keys(array_keys(self::PROGRAM_VISUALS), 0));

        if (Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $counts = Group::query()
                ->selectRaw('program_sets.program as program, COUNT(*) as total')
                ->join('program_sets', 'program_sets.id', '=', 'groups.program_set_id')
                ->whereIn('program_sets.program', $programCounts->keys()->all())
                ->whereNotNull('groups.approved_concept_submission_id')
                ->groupBy('program_sets.program')
                ->pluck('total', 'program');

            foreach ($programCounts->keys() as $program) {
                $programCounts[$program] = (int) ($counts->get($program, 0));
            }
        }

        return collect(self::PROGRAM_VISUALS)
            ->map(fn (array $visual, string $program): array => [
                'label' => $visual['label'],
                'value' => (int) ($programCounts->get($program, 0)),
                'color' => $visual['color'],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, value: int, program: string|null}>
     */
    private function buildProgramSetApprovedGroupDistribution(): array
    {
        if (! Schema::hasTable('program_sets') || ! Schema::hasTable('groups')) {
            return [];
        }

        return ProgramSet::query()
            ->whereIn('program', $this->deanProgramScope)
            ->withCount([
                'groups as approved_groups_count' => fn (Builder $query): Builder => $query->whereNotNull('approved_concept_submission_id'),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'program'])
            ->map(static fn (ProgramSet $programSet): array => [
                'label' => (string) $programSet->name,
                'value' => (int) ($programSet->approved_groups_count ?? 0),
                'program' => $programSet->program,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{events: array<int, array{occurredAt: string}>}
     */
    private function buildApprovalTrend(): array
    {
        $events = [];

        if (! Schema::hasTable('groups') || ! Schema::hasTable('program_sets')) {
            return ['events' => $events];
        }

        $cutoff = now()->subDays(6)->startOfDay();

        if (Schema::hasTable('document_submissions')) {
            $events = Group::query()
                ->selectRaw('COALESCE(groups.concept_verdict_decided_at, document_submissions.created_at) as occurred_at')
                ->join('program_sets', 'program_sets.id', '=', 'groups.program_set_id')
                ->join('document_submissions', 'document_submissions.id', '=', 'groups.approved_concept_submission_id')
                ->whereIn('program_sets.program', $this->deanProgramScope)
                ->whereNotNull('groups.approved_concept_submission_id')
                ->where(function (Builder $query) use ($cutoff): void {
                    $query
                        ->where('groups.concept_verdict_decided_at', '>=', $cutoff)
                        ->orWhere('document_submissions.created_at', '>=', $cutoff);
                })
                ->orderBy('occurred_at')
                ->get()
                ->map(static fn ($row): array => [
                    'occurredAt' => (string) ($row->occurred_at ?? ''),
                ])
                ->filter(static fn (array $event): bool => trim($event['occurredAt']) !== '')
                ->values()
                ->all();
        } else {
            $events = Group::query()
                ->select(['concept_verdict_decided_at'])
                ->whereNotNull('approved_concept_submission_id')
                ->whereNotNull('concept_verdict_decided_at')
                ->whereHas('programSet', fn (Builder $query): Builder => $query->whereIn('program', $this->deanProgramScope))
                ->where('concept_verdict_decided_at', '>=', $cutoff)
                ->orderBy('concept_verdict_decided_at')
                ->get()
                ->map(static fn (Group $group): array => [
                    'occurredAt' => (string) ($group->concept_verdict_decided_at?->format('Y-m-d H:i:s') ?? ''),
                ])
                ->filter(static fn (array $event): bool => trim($event['occurredAt']) !== '')
                ->values()
                ->all();
        }

        return ['events' => $events];
    }

    /**
     * @return array<int, array{
     *     id: int,
     *     groupName: string,
     *     title: string,
     *     program: string|null,
     *     approvedAt: string|null,
     * }>
     */
    private function buildRecentApprovals(): array
    {
        if (! Schema::hasTable('groups') || ! Schema::hasTable('program_sets')) {
            return [];
        }

        return Group::query()
            ->with([
                'programSet:id,name,program',
                'approvedConceptSubmission:id,file_name,created_at',
            ])
            ->whereHas('programSet', fn (Builder $query): Builder => $query->whereIn('program', $this->deanProgramScope))
            ->whereNotNull('approved_concept_submission_id')
            ->orderByDesc('concept_verdict_decided_at')
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get()
            ->map(static function (Group $group): array {
                $approvedTitle = $group->approvedConceptSubmission?->file_name;
                $approvedAt = $group->concept_verdict_decided_at?->format('Y-m-d H:i')
                    ?? $group->approvedConceptSubmission?->created_at?->format('Y-m-d H:i');

                return [
                    'id' => (int) $group->id,
                    'groupName' => is_string($group->name) ? $group->name : '',
                    'title' => is_string($approvedTitle) ? $approvedTitle : 'Untitled Concept',
                    'program' => $group->programSet?->program,
                    'approvedAt' => $approvedAt,
                ];
            })
            ->values()
            ->all();
    }
}
