<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Tenant
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'Default Organization', 'is_active' => true]
        );

        // 2. Seed Super Admin
        User::updateOrCreate(
            ['username' => 'superadmin'],
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'tenant_id' => null,
            ]
        );

        // 3. Seed Org Admin
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Organization Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('admin123'),
                'role' => 'org_admin',
                'tenant_id' => $tenant->id,
            ]
        );

        // 4. Seed Teacher
        User::updateOrCreate(
            ['username' => 'teacher'],
            [
                'name' => 'Teacher User',
                'email' => 'teacher@example.com',
                'password' => Hash::make('teacher123'),
                'role' => 'teacher',
                'tenant_id' => $tenant->id,
            ]
        );

        // 5. Seed Student
        User::updateOrCreate(
            ['username' => 'karthik'],
            [
                'name' => 'Karthik',
                'email' => null,
                'password' => Hash::make('test123'),
                'role' => 'student',
                'tenant_id' => $tenant->id,
            ]
        );
        $this->call([
            TamilYappuSeeder::class,
            PracticeWordSeeder::class,
            EluthuActivitySeeder::class,
            YappuSeerActivitySeeder::class,
            YappuSeerWordSeeder::class,
            GlobalTenantSeeder::class,
        ]);
    }
}
