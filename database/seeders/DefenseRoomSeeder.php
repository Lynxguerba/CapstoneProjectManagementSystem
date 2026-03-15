<?php

namespace Database\Seeders;

use App\Models\DefenseRoom;
use Illuminate\Database\Seeder;

class DefenseRoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DefenseRoom::factory()
            ->count(3)
            ->create();
    }
}
