<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class DestroyPanelistLiveDefenseCommentController extends Controller
{
    public function __invoke(Request $request, LiveDefenseComment $comment): RedirectResponse
    {
        if (! Schema::hasTable('live_defense_comments')) {
            return back()->with('error', 'Live defense comments table is not available yet.');
        }

        $user = $request->user();
        if ($user === null || ! $user->hasRole('panelist')) {
            abort(403);
        }

        $isAssignedPanelist = GroupPanelist::query()
            ->where('group_id', $comment->group_id)
            ->where('panelist_id', $user->id)
            ->exists();

        if (! $isAssignedPanelist) {
            abort(403);
        }

        if ((int) ($comment->author_id ?? 0) !== (int) $user->id) {
            abort(403);
        }

        $groupId = (int) $comment->group_id;
        $comment->delete();

        $activeStage = $this->resolveRequestedStage($request->input('stage'));

        return redirect()->route('panelist.live-defense', array_filter([
            'group' => $groupId,
            'stage' => $activeStage,
        ], static fn (mixed $value): bool => $value !== null));
    }

    private function resolveRequestedStage(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $normalizedStage = trim($value);

        return $normalizedStage !== '' ? $normalizedStage : null;
    }
}
