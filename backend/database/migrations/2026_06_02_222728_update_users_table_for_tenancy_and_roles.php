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
        // Create the users table since it doesn't exist
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            
            // Tenant relation (nullable for global super_admins)
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
            
            $table->string('name');
            
            // Username (unique, nullable for flexibility)
            $table->string('username', 50)->nullable()->unique();
            
            // Email (nullable to support young students who do not have personal emails)
            $table->string('email')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            
            $table->string('password');
            
            // User roles: super_admin, tenant_admin, property_manager, student
            $table->string('role', 30)->default('student');
            
            $table->rememberToken();
            $table->timestamps();
        });

        // Also create the sessions table if needed for session driver compatibility
        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('sessions');
    }
};
