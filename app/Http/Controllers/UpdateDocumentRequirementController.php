<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDocumentRequirementRequest;
use App\Models\DocumentRequirement;
use Illuminate\Http\RedirectResponse;

class UpdateDocumentRequirementController extends Controller
{
    public function __invoke(UpdateDocumentRequirementRequest $request, DocumentRequirement $requirement): RedirectResponse
    {
        $data = $request->validated();

        $requirement->update([
            'requirement_type' => trim((string) $data['requirement_type']),
            'due_date' => $data['due_date'],
            'is_mandatory' => $data['is_mandatory'] ?? true,
            'academic_year_id' => (int) $data['academic_year_id'],
        ]);

        return back()->with('success', 'Requirement updated successfully.');
    }
}
