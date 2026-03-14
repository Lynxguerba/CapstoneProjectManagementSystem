<?php

namespace Database\Seeders;

use App\Models\GroupAdviser;
use Illuminate\Database\Seeder;

class GroupAdviserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        GroupAdviser::factory()
            ->count(3)
            ->create();
    }
}
