<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequirementRequest;
use App\Models\DocumentRequirement;
use Illuminate\Http\RedirectResponse;

class StoreDocumentRequirementController extends Controller
{
    public function __invoke(StoreDocumentRequirementRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $stage = is_string($data['stage'] ?? null) ? trim((string) $data['stage']) : 'Concept';

        if ($stage === '') {
            $stage = 'Concept';
        }

        DocumentRequirement::query()->create([
            'requirement_type' => trim((string) $data['requirement_type']),
            'due_date' => $data['due_date'],
            'stage' => $stage,
            'is_mandatory' => $data['is_mandatory'] ?? true,
            'academic_year_id' => (int) $data['academic_year_id'],
            'created_by' => $user?->id,
        ]);

        return back()->with('success', 'Requirement added successfully.');
    }
}
