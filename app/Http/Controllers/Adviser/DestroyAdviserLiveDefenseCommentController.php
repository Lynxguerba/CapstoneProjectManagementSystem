<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Models\GroupAdviser;
use App\Models\LiveDefenseComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class DestroyAdviserLiveDefenseCommentController extends Controller
{
    public function __invoke(Request $request, LiveDefenseComment $comment): RedirectResponse
    {
        if (! Schema::hasTable('live_defense_comments')) {
            return back()->with('error', 'Live defense comments table is not available yet.');
        }

        $user = $request->user();
        if ($user === null || ! $user->hasRole('adviser')) {
            abort(403);
        }

        $isAssignedAdviser = GroupAdviser::query()
            ->where('group_id', $comment->group_id)
            ->where('adviser_id', $user->id)
            ->exists();

        if (! $isAssignedAdviser) {
            abort(403);
        }

        if ((int) ($comment->author_id ?? 0) !== (int) $user->id) {
            abort(403);
        }

        $groupId = (int) $comment->group_id;
        $comment->delete();

        return redirect()->route('adviser.live-defense', [
            'group' => $groupId,
        ]);
    }
}
