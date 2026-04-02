<?php

namespace App\Http\Controllers;

use App\Models\DefenseSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DestroyDefenseScheduleController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, DefenseSchedule $schedule): RedirectResponse
    {
        $schedule->loadMissing('group.programSet');
        $userId = $request->user()?->id;
        if ($userId !== null && $schedule->group?->programSet?->instructor_id !== $userId) {
            abort(403);
        }

        $schedule->delete();

        return back()->with('success', 'Schedule removed successfully.');
    }
}
