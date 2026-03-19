<?php

namespace App\Http\Controllers;

use App\Models\DocumentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadDocumentSubmissionController extends Controller
{
    public function __invoke(Request $request, DocumentSubmission $submission): StreamedResponse
    {
        $submission->loadMissing('group.programSet');

        $userId = $request->user()?->id;
        $programSet = $submission->group?->programSet;

        if ($userId === null || $programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($submission->file_path)) {
            abort(404);
        }

        return $disk->download($submission->file_path, $submission->file_name);
    }
}
