<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_packages', function (Blueprint $table) {
            // Drop old unique constraint
            $table->dropUnique('unique_property_package');
            
            // Add new unique constraint including course_id
            $table->unique(['property_id', 'package_id', 'course_id'], 'unique_property_package_course');
        });
    }

    public function down(): void
    {
        Schema::table('property_packages', function (Blueprint $table) {
            $table->dropUnique('unique_property_package_course');
            $table->unique(['property_id', 'package_id'], 'unique_property_package');
        });
    }
};
