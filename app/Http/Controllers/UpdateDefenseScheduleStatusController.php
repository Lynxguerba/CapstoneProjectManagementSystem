<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDefenseScheduleStatusRequest;
use App\Models\DefenseSchedule;
use Illuminate\Http\RedirectResponse;

class UpdateDefenseScheduleStatusController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateDefenseScheduleStatusRequest $request, DefenseSchedule $schedule): RedirectResponse
    {
        $data = $request->validated();

        $schedule->loadMissing('group.programSet');
        $userId = $request->user()?->id;
        if ($userId !== null && $schedule->group?->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $schedule->update([
            'status' => $data['status'],
        ]);

        return back()->with('success', 'Schedule status updated successfully.');
    }
}
