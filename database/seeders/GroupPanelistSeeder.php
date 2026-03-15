<?php

namespace Database\Seeders;

use App\Models\GroupPanelist;
use Illuminate\Database\Seeder;

class GroupPanelistSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        GroupPanelist::factory()
            ->count(3)
            ->create();
    }
}
