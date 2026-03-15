<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDefenseRoomRequest;
use App\Models\DefenseRoom;
use Illuminate\Http\RedirectResponse;

class StoreDefenseRoomController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(StoreDefenseRoomRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DefenseRoom::query()->create([
            'name' => $data['name'],
            'capacity' => $data['capacity'],
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Defense room added successfully.');
    }
}
