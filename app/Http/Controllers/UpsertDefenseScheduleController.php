<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertDefenseScheduleRequest;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpsertDefenseScheduleController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpsertDefenseScheduleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $group = Group::query()
            ->with(['programSet.academicYear', 'panelAssignments'])
            ->whereKey($data['group_id'])
            ->firstOrFail();

        $userId = $request->user()?->id;
        if ($userId !== null && $group->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        if ($group->panelAssignments->count() < 3) {
            throw ValidationException::withMessages([
                'group_id' => 'Assign three panelists before scheduling this defense.',
            ]);
        }

        if (! $this->hasApprovedConceptRequirements($group)) {
            throw ValidationException::withMessages([
                'group_id' => 'Approve all required documents before scheduling this defense.',
            ]);
        }

        $room = DefenseRoom::query()->whereKey($data['room_id'])->firstOrFail();
        if (! $room->is_active) {
            throw ValidationException::withMessages([
                'room_id' => 'Selected room is inactive.',
            ]);
        }

        $existingSchedule = null;
        if (! empty($data['schedule_id'])) {
            $existingSchedule = DefenseSchedule::query()->whereKey($data['schedule_id'])->first();
            if ($existingSchedule !== null && $existingSchedule->group_id !== $group->id) {
                abort(403);
            }
        }

        if ($existingSchedule === null) {
            $existingSchedule = DefenseSchedule::query()
                ->where('group_id', $group->id)
                ->where('stage', $data['stage'])
                ->first();
        }

        $conflictQuery = DefenseSchedule::query()
            ->where('room_id', $room->id)
            ->where('scheduled_date', $data['scheduled_date'])
            ->where(function ($query) use ($data) {
                $query->where('start_time', '<', $data['end_time'])
                    ->where('end_time', '>', $data['start_time']);
            });

        if ($existingSchedule !== null) {
            $conflictQuery->whereKeyNot($existingSchedule->id);
        }

        if ($conflictQuery->exists()) {
            throw ValidationException::withMessages([
                'room_id' => 'Room is already booked for the selected time slot.',
            ]);
        }

        if ($existingSchedule !== null) {
            $existingSchedule->update([
                'group_id' => $group->id,
                'room_id' => $room->id,
                'scheduled_date' => $data['scheduled_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'stage' => $data['stage'],
                'status' => $data['status'] ?? $existingSchedule->status,
                'notes' => $data['notes'] ?? null,
                'scheduled_by' => $userId,
            ]);
        } else {
            DefenseSchedule::query()->updateOrCreate(
                [
                    'group_id' => $group->id,
                    'stage' => $data['stage'],
                ],
                [
                    'room_id' => $room->id,
                    'scheduled_date' => $data['scheduled_date'],
                    'start_time' => $data['start_time'],
                    'end_time' => $data['end_time'],
                    'status' => $data['status'] ?? 'Scheduled',
                    'notes' => $data['notes'] ?? null,
                    'scheduled_by' => $userId,
                ],
            );
        }

        return back()->with('success', 'Defense schedule saved successfully.');
    }

    private function hasApprovedConceptRequirements(Group $group): bool
    {
        if (
            ! class_exists(DocumentRequirement::class)
            || ! class_exists(DocumentSubmission::class)
            || ! Schema::hasTable('document_requirements')
            || ! Schema::hasTable('document_submissions')
        ) {
            return true;
        }

        $group->loadMissing('programSet.academicYear');
        $groupSchoolYear = trim((string) ($group->programSet?->academicYear?->label ?? $group->programSet?->school_year ?? ''));

        $requirements = DocumentRequirement::query()
            ->with('academicYear')
            ->where('stage', 'Concept')
            ->orderBy('id')
            ->get(['id', 'requirement_type', 'academic_year_id']);

        $applicableRequirements = $requirements
            ->filter(function (DocumentRequirement $requirement) use ($groupSchoolYear): bool {
                $requirementSchoolYear = trim((string) ($requirement->academicYear?->label ?? ''));

                if ($requirementSchoolYear === '') {
                    return true;
                }

                if ($groupSchoolYear === '') {
                    return false;
                }

                return $groupSchoolYear === $requirementSchoolYear;
            })
            ->values();

        if ($applicableRequirements->isEmpty()) {
            return true;
        }

        $latestSubmissionsByRequirement = DocumentSubmission::query()
            ->where('group_id', $group->id)
            ->whereIn('document_requirement_id', $applicableRequirements->pluck('id')->all())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id', 'document_requirement_id', 'status'])
            ->unique('document_requirement_id')
            ->keyBy('document_requirement_id');

        return $applicableRequirements->every(
            fn (DocumentRequirement $requirement): bool => $this->isRequirementApproved($requirement, $latestSubmissionsByRequirement)
        );
    }

    private function isRequirementApproved(DocumentRequirement $requirement, Collection $latestSubmissionsByRequirement): bool
    {
        /** @var DocumentSubmission|null $submission */
        $submission = $latestSubmissionsByRequirement->get($requirement->id);

        if (! $submission instanceof DocumentSubmission) {
            return false;
        }

        if ($submission->status === 'Approved') {
            return true;
        }

        $requirementType = strtolower(trim((string) ($requirement->requirement_type ?? '')));

        return $submission->status === 'Submitted' && str_contains($requirementType, 'recommendation');
    }
}
