<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the local admin account. Idempotent: re-running keeps the same row
     * and only ensures the admin flag and a known dev password.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@kayana.test'],
            [
                'name' => 'Onyarianto Prapanca',
                'password' => Hash::make('password'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ],
        );
    }
}
