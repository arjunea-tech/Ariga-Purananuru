<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create a temporary index on property_id so the foreign key is satisfied
        Schema::table('property_packages', function (Blueprint $table) {
            $table->index('property_id', 'property_packages_property_id_temp_idx');
        });

        // 2. Drop the old unique index and create the new unique index
        Schema::table('property_packages', function (Blueprint $table) {
            $table->dropUnique('unique_property_package');
            $table->unique(['property_id', 'package_id', 'course_id'], 'unique_property_package_course');
        });

        // 3. Drop the temporary index since the new unique index covers property_id
        Schema::table('property_packages', function (Blueprint $table) {
            $table->dropIndex('property_packages_property_id_temp_idx');
        });
    }

    public function down(): void
    {
        // 1. Create a temporary index on property_id
        Schema::table('property_packages', function (Blueprint $table) {
            $table->index('property_id', 'property_packages_property_id_temp_idx');
        });

        // 2. Drop the new unique index and recreate the old unique index
        Schema::table('property_packages', function (Blueprint $table) {
            $table->dropUnique('unique_property_package_course');
            $table->unique(['property_id', 'package_id'], 'unique_property_package');
        });

        // 3. Drop the temporary index
        Schema::table('property_packages', function (Blueprint $table) {
            $table->dropIndex('property_packages_property_id_temp_idx');
        });
    }
};
