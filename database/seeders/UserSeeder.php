<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = ['student', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson'];

        foreach ($roles as $role) {
            User::create([
                'name' => ucfirst($role) . ' User',
                'email' => $role . '@example.com',
                'password' => Hash::make('password'),
                'role' => $role,
            ]);
        }
    }
}
