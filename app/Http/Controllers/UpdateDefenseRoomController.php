<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDefenseRoomRequest;
use App\Models\DefenseRoom;
use Illuminate\Http\RedirectResponse;

class UpdateDefenseRoomController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateDefenseRoomRequest $request, DefenseRoom $room): RedirectResponse
    {
        $data = $request->validated();
        $notes = $data['notes'] ?? null;

        if (is_string($notes)) {
            $notes = trim($notes);
        }

        $room->update([
            'name' => $request->string('name')->trim()->toString(),
            'capacity' => (int) $data['capacity'],
            'notes' => $notes !== '' ? $notes : null,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $room->is_active,
        ]);

        return back()->with('success', 'Room updated successfully.');
    }
}
