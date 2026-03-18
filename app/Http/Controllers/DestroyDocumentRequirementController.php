<?php

namespace App\Http\Controllers;

use App\Models\DocumentRequirement;
use Illuminate\Http\RedirectResponse;

class DestroyDocumentRequirementController extends Controller
{
    public function __invoke(DocumentRequirement $requirement): RedirectResponse
    {
        $requirement->delete();

        return back()->with('success', 'Requirement removed.');
    }
}
