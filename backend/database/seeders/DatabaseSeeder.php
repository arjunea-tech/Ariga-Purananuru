<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Super Admin (Global Administrator with no tenant_id)
        User::updateOrCreate(
            ['username' => 'superadmin'],
            [
                'name' => 'Global Administrator',
                'email' => 'admin@ariga.local',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'tenant_id' => null,
            ]
        );

        // 2. Seed a default Tenant (strictly required to link tenant-scoped users)
        $tenant = Tenant::updateOrCreate(
            ['tenant_code' => 'SCH-001'],
            [
                'tenant_name' => 'Ariga Public School',
                'contact_person' => 'Principal Office',
                'email' => 'contact@ariga.school',
                'is_active' => true,
                'primary_color' => '#7c3aed',
                'secondary_color' => '#db2777',
            ]
        );

        // 4. Seed Staff (School Coordinator)
        User::updateOrCreate(
            ['username' => 'coordinator'],
            [
                'name' => 'School Coordinator',
                'email' => 'manager@ariga.school',
                'password' => Hash::make('admin123'),
                'role' => 'staff',
                'tenant_id' => $tenant->id,
            ]
        );

        // 5. Seed Student
        User::updateOrCreate(
            ['username' => 'karthik_std'],
            [
                'name' => 'Karthik Student',
                'email' => null,
                'password' => Hash::make('student123'),
                'role' => 'student',
                'tenant_id' => $tenant->id,
            ]
        );
        $this->call([
            TamilYappuSeeder::class,
        ]);
    }
}
