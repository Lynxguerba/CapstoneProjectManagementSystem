<?php

namespace App\Http\Controllers\Panelist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panelist\StoreLiveDefenseCommentRequest;
use App\Models\DocumentSubmission;
use App\Models\GroupPanelist;
use App\Models\LiveDefenseComment;
use App\Models\LiveDefenseCommentHighlight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class StorePanelistLiveDefenseCommentController extends Controller
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
        if ($user === null || ! $user->hasRole('panelist')) {
            abort(403);
        }

        $validated = $request->validated();
        $submissionId = (int) $validated['document_submission_id'];
        $submission = DocumentSubmission::query()
            ->whereKey($submissionId)
            ->first(['id', 'group_id']);

        if (! $submission instanceof DocumentSubmission) {
            throw ValidationException::withMessages([
                'document_submission_id' => 'Selected concept submission is not available.',
            ]);
        }

        $isAssignedPanelist = GroupPanelist::query()
            ->where('group_id', $submission->group_id)
            ->where('panelist_id', $user->id)
            ->exists();

        if (! $isAssignedPanelist) {
            abort(403);
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

        DB::transaction(function () use ($highlightPayload, $isHighlightComment, $message, $submission, $user): void {
            $comment = LiveDefenseComment::query()->create([
                'group_id' => $submission->group_id,
                'document_submission_id' => $submission->id,
                'author_id' => $user->id,
                'author_role' => 'Panelist',
                'message' => $message,
                'is_highlight_comment' => $isHighlightComment,
            ]);

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

        $activeStage = $this->resolveRequestedStage($request->input('stage'));

        return redirect()->route('panelist.live-defense', array_filter([
            'group' => $submission->group_id,
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
