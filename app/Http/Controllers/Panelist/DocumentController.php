<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupPanelist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    /**
     * @var array<string, string>
     */
    private const STATUS_MAP = [
        'Submitted' => 'In Progress',
        'Approved' => 'Reviewed',
        'Revision Required' => 'Needs Revision',
    ];

    public function index(Request $request): Response
    {
        $panelistId = Auth::id();
        $assignedGroupIds = GroupPanelist::query()
            ->where('panelist_id', $panelistId)
            ->pluck('group_id')
            ->toArray();

        $query = DocumentSubmission::query()
            ->with(['group:id,name', 'requirement:id,requirement_type,stage'])
            ->whereIn('group_id', $assignedGroupIds);

        // Filters
        $search = $request->input('search');
        $groupFilter = $request->input('group');
        $statusFilter = $request->input('status');
        $categoryFilter = $request->input('category');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', "%{$search}%")
                    ->orWhereHas('group', fn ($g) => $g->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('requirement', fn ($r) => $r->where('requirement_type', 'like', "%{$search}%"))
                    ->orWhereHas('requirement', fn ($r) => $r->where('stage', 'like', "%{$search}%"));
            });
        }

        if ($groupFilter && $groupFilter !== 'all') {
            $query->whereHas('group', fn ($g) => $g->where('name', $groupFilter));
        }

        if ($statusFilter && $statusFilter !== 'all') {
            $backendStatus = array_search($statusFilter, self::STATUS_MAP, true);
            if ($backendStatus) {
                $query->where('status', $backendStatus);
            }
        }

        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->whereHas('requirement', fn ($r) => $r->where('requirement_type', $categoryFilter));
        }

        $documents = $query->orderByDesc('updated_at')
            ->get()
            ->map(fn ($doc) => [
                'id' => (int) $doc->id,
                'group' => (string) $doc->group?->name,
                'defenseType' => (string) $doc->requirement?->stage,
                'category' => (string) $doc->requirement?->requirement_type,
                'fileName' => (string) $doc->file_name,
                'uploadedAt' => $doc->created_at->format('Y-m-d'),
                'status' => self::STATUS_MAP[$doc->status] ?? 'Not Reviewed',
            ]);

        $groups = Group::query()
            ->whereIn('id', $assignedGroupIds)
            ->pluck('name')
            ->toArray();

        $categories = DocumentRequirement::query()
            ->whereIn('id', function($q) use ($assignedGroupIds) {
                $q->select('document_requirement_id')
                    ->from('document_submissions')
                    ->whereIn('group_id', $assignedGroupIds);
            })
            ->distinct()
            ->pluck('requirement_type')
            ->toArray();

        return Inertia::render('Panelist/documents/document-list', [
            'documents' => $documents,
            'groups' => $groups,
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
                'group' => $groupFilter ?? 'all',
                'status' => $statusFilter ?? 'all',
                'category' => $categoryFilter ?? 'all',
            ],
        ]);
    }

    public function show(DocumentSubmission $document): Response
    {
        $document->load([
            'group.members',
            'group.programSet.academicYear',
            'group.panelAssignments.panelist',
            'group.adviserAssignment.adviser',
            'requirement',
            'liveDefenseComments.author'
        ]);

        $group = $document->group;
        $adviser = $group?->adviserAssignment?->adviser;

        return Inertia::render('Panelist/documents/document-viewer', [
            'document' => [
                'id' => $document->id,
                'group' => $document->group?->name,
                'fileName' => $document->file_name,
                'fileUrl' => \Illuminate\Support\Facades\Storage::url($document->file_path),
                'category' => $document->requirement?->requirement_type,
                'uploadedAt' => $document->created_at->format('Y-m-d H:i'),
                'status' => self::STATUS_MAP[$document->status] ?? 'Not Reviewed',
            ],
            'groupDetails' => [
                'name' => $group?->name,
                'program' => $group?->programSet?->program,
                'academicYear' => $group?->programSet?->academicYear?->label,
                'adviser' => $adviser ? [
                    'name' => $adviser->name,
                    'email' => $adviser->email,
                ] : null,
                'members' => $group?->members->map(fn ($m) => [
                    'name' => $m->name,
                    'role' => $m->pivot?->role,
                ]),
            ],
            'comments' => $document->liveDefenseComments->map(fn ($comment) => [
                'id' => (string) $comment->id,
                'author' => $comment->author?->name,
                'authorRole' => $comment->author?->role,
                'message' => $comment->message,
                'createdAt' => $comment->created_at->format('Y-m-d H:i'),
            ]),
        ]);
    }
}
