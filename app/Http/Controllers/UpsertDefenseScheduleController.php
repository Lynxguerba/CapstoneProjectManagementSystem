<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertDefenseScheduleRequest;
use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\Group;
use Illuminate\Http\RedirectResponse;
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
            ->with(['programSet', 'panelAssignments'])
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
}
