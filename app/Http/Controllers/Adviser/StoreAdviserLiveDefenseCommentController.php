<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\StoreLiveDefenseCommentRequest;
use App\Models\DocumentSubmission;
use App\Models\GroupAdviser;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use App\Models\LiveDefenseCommentHighlight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class StoreAdviserLiveDefenseCommentController extends Controller
{
    public function __invoke(StoreLiveDefenseCommentRequest $request): RedirectResponse
    {
        if (! Schema::hasTable('live_defense_comments')) {
            return back()->with('error', 'Live defense comments table is not available yet. Please run migrations first.');
        }

        if (! Schema::hasTable('live_defense_comment_highlights')) {
            return back()->with('error', 'Live defense highlights table is not available yet. Please run migrations first.');
        }

        $user = $request->user();
        if ($user === null || ! $user->hasRole('adviser')) {
            abort(403);
        }

        $validated = $request->validated();
        $submissionId = (int) $validated['document_submission_id'];
        $panelistId = (int) $validated['panelist_id'];
        $submission = DocumentSubmission::query()
            ->whereKey($submissionId)
            ->first(['id', 'group_id']);

        if (! $submission instanceof DocumentSubmission) {
            throw ValidationException::withMessages([
                'document_submission_id' => 'Selected concept submission is not available.',
            ]);
        }

        $isAssignedAdviser = GroupAdviser::query()
            ->where('group_id', $submission->group_id)
            ->where('adviser_id', $user->id)
            ->exists();

        if (! $isAssignedAdviser) {
            abort(403);
        }

        $isSelectedPanelistAssigned = GroupPanelist::query()
            ->where('group_id', $submission->group_id)
            ->where('panelist_id', $panelistId)
            ->exists();

        if (! $isSelectedPanelistAssigned) {
            throw ValidationException::withMessages([
                'panelist_id' => 'Select a panelist assigned to this group.',
            ]);
        }

        $message = trim((string) $validated['message']);
        if ($message === '') {
            throw ValidationException::withMessages([
                'message' => 'Enter a comment before sending.',
            ]);
        }

        $isHighlightComment = (bool) $validated['is_highlight_comment'];
        /** @var array<string, mixed>|null $highlightPayload */
        $highlightPayload = is_array($validated['highlight'] ?? null) ? $validated['highlight'] : null;

        if ($isHighlightComment && $highlightPayload === null) {
            throw ValidationException::withMessages([
                'highlight' => 'Highlight details are required for highlighted comments.',
            ]);
        }

        $hasReferencedPanelistColumn = Schema::hasColumn('live_defense_comments', 'referenced_panelist_id');

        DB::transaction(function () use ($hasReferencedPanelistColumn, $highlightPayload, $isHighlightComment, $message, $panelistId, $submission, $user): void {
            $commentPayload = [
                'group_id' => $submission->group_id,
                'document_submission_id' => $submission->id,
                'author_id' => $user->id,
                'author_role' => 'Adviser',
                'message' => $message,
                'is_highlight_comment' => $isHighlightComment,
            ];

            if ($hasReferencedPanelistColumn) {
                $commentPayload['referenced_panelist_id'] = $panelistId;
            }

            $comment = LiveDefenseComment::query()->create($commentPayload);

            if (! $isHighlightComment || $highlightPayload === null) {
                return;
            }

            $content = is_array($highlightPayload['content'] ?? null) ? $highlightPayload['content'] : null;
            $position = is_array($highlightPayload['position'] ?? null) ? $highlightPayload['position'] : null;
            $quoteText = is_string($highlightPayload['quote_text'] ?? null)
                ? trim((string) $highlightPayload['quote_text'])
                : null;
            $contentQuote = is_string($content['text'] ?? null) ? trim((string) $content['text']) : null;
            $normalizedQuoteText = $quoteText !== '' ? $quoteText : $contentQuote;
            $commentEmoji = is_string($highlightPayload['comment_emoji'] ?? null)
                ? trim((string) $highlightPayload['comment_emoji'])
                : '';

            LiveDefenseCommentHighlight::query()->create([
                'live_defense_comment_id' => $comment->id,
                'highlight_id' => (string) $highlightPayload['highlight_id'],
                'quote_text' => $normalizedQuoteText !== '' ? $normalizedQuoteText : null,
                'comment_emoji' => $commentEmoji !== '' ? $commentEmoji : '💬',
                'content' => $content,
                'position' => $position,
            ]);
        });

        return redirect()->route('adviser.live-defense', [
            'group' => $submission->group_id,
        ]);
    }
}
