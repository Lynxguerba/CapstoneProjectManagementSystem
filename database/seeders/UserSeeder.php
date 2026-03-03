<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = ['admin', 'student', 'adviser', 'panelist', 'instructor', 'dean', 'program_chairperson'];

        foreach ($roles as $role) {
            $displayName = str($role)->replace('_', ' ')->title()->toString().' User';
            $firstName = str($role)->replace('_', ' ')->title()->toString();
            $lastName = 'User';

            User::query()->updateOrCreate(
                ['email' => $role.'@example.com'],
                [
                    'name' => $displayName,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'password' => Hash::make('password'),
                    'role' => $role,
                    'status' => 'active',
                ]
            );
        }
    }
}
