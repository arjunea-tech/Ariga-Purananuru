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
        // Clean old data to start fresh
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('users')->truncate();
        DB::table('tenants')->truncate();
        DB::table('courses')->truncate();
        DB::table('levels')->truncate();
        DB::table('chapters')->truncate();
        DB::table('contents')->truncate();
        DB::table('assessments')->truncate();
        DB::table('assessment_questions')->truncate();
        DB::table('question_options')->truncate();
        DB::table('course_package_levels')->truncate();
        DB::table('level_chapter')->truncate();
        DB::table('content_chapters')->truncate();
        DB::table('packages')->truncate();
        DB::table('properties')->truncate();
        DB::table('property_packages')->truncate();
        DB::table('learning_modes')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Seed Super Admin (Global Administrator with no tenant_id)
        User::create([
            'name' => 'Global Administrator',
            'username' => 'superadmin',
            'email' => 'admin@ariga.local',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'tenant_id' => null,
        ]);

        // 2. Seed a default Tenant (strictly required to link tenant-scoped users)
        $tenant = Tenant::create([
            'tenant_code' => 'SCH-001',
            'tenant_name' => 'Ariga Public School',
            'contact_person' => 'Principal Office',
            'email' => 'contact@ariga.school',
            'is_active' => true,
            'primary_color' => '#7c3aed',
            'secondary_color' => '#db2777',
        ]);

        // 4. Seed Property Manager (School Coordinator)
        User::create([
            'name' => 'School Coordinator',
            'username' => 'coordinator',
            'email' => 'manager@ariga.school',
            'password' => Hash::make('admin123'),
            'role' => 'property_manager',
            'tenant_id' => $tenant->id,
        ]);

        // 5. Seed Student
        User::create([
            'name' => 'Karthik Student',
            'username' => 'karthik_std',
            'email' => null,
            'password' => Hash::make('student123'),
            'role' => 'student',
            'tenant_id' => $tenant->id,
        ]);
    }
}
