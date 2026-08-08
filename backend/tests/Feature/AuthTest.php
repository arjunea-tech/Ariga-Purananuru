<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        // Seed the PUBLIC tenant first
        Tenant::create([
            'tenant_name' => 'Public Tenant',
            'tenant_code' => 'PUBLIC',
            'email' => 'public@example.com',
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'login' => 'testuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'student',
            'tenant_code' => 'PUBLIC',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'user' => ['id', 'name', 'email', 'role', 'tenant_id'],
                     'access_token',
                     'token_type'
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'testuser@example.com',
            'role' => 'student',
        ]);
    }

    public function test_user_can_login()
    {
        $tenant = Tenant::create([
            'tenant_name' => 'Public Tenant',
            'tenant_code' => 'PUBLIC',
            'email' => 'public@example.com',
        ]);

        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'role' => 'student',
            'tenant_id' => $tenant->id,
        ]);

        $response = $this->postJson('/api/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'user' => ['id', 'name', 'email', 'role'],
                     'access_token',
                     'token_type'
                 ]);
    }

    public function test_login_rate_limiting()
    {
        \Illuminate\Support\Facades\Cache::flush();

        Tenant::create([
            'tenant_name' => 'Public Tenant',
            'tenant_code' => 'PUBLIC',
            'email' => 'public@example.com',
        ]);

        // Attempt 5 logins (valid limit is 5 per minute)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/login', [
                'login' => 'wrong@example.com',
                'password' => 'badpass',
            ]);
            $response->assertStatus(422);
        }

        // Attempt 6th login (should trigger 429 Too Many Requests due to throttle middleware)
        $response = $this->postJson('/api/login', [
            'login' => 'wrong@example.com',
            'password' => 'badpass',
        ]);

        $response->assertStatus(429);
    }
}
