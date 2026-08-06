<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GlobalTenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Tenant::firstOrCreate(
            ['tenant_code' => 'PUBLIC'],
            [
                'tenant_name' => 'Ariga Public Academy',
                'contact_person' => 'Admin',
                'email' => 'admin@azhagutamil.com',
                'is_active' => true,
                'primary_color' => '#7c3aed',
                'secondary_color' => '#db2777',
            ]
        );
    }
}
