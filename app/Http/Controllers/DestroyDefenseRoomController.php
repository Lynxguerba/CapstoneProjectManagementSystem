<?php

namespace App\Http\Controllers;

use App\Models\DefenseRoom;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DestroyDefenseRoomController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, DefenseRoom $room): RedirectResponse
    {
        if ($room->schedules()->exists()) {
            return back()->withErrors([
                'room' => 'This room has scheduled defenses and cannot be removed.',
            ]);
        }

        $room->delete();

        return back()->with('success', 'Room removed successfully.');
    }
}
