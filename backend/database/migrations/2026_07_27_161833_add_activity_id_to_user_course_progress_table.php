<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_course_progress', function (Blueprint $table) {
            $table->string('activity_id')->nullable()->after('chapter_id')->comment('Uniquely identifies individual questions within a chapter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_course_progress', function (Blueprint $table) {
            $table->dropColumn('activity_id');
        });
    }
};
