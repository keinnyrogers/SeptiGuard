<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_user_can_log_in_through_the_api(): void
    {
        $user = User::factory()->create([
            'email' => 'resident@example.com',
            'password' => 'password123',
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.demo_mode', false)
            ->assertJsonStructure(['token', 'user']);
        $this->assertNotEmpty($response->json('token'));
    }

    public function test_approved_hoa_admin_can_log_in_through_the_admin_api(): void
    {
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);

        $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'hoa_admin')
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_resident_cannot_log_in_through_the_admin_api(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $this->postJson('/api/admin/login', [
            'email' => $resident->email,
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'This sign-in page is for HOA administrators. Please use the resident sign-in instead.');

        $this->assertNull($resident->fresh()->api_token_hash);
    }

    public function test_hoa_admin_must_use_the_admin_login_endpoint(): void
    {
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);

        $this->postJson('/api/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'This sign-in page is for residents. Please use the HOA administrator sign-in instead.');

        $this->assertNull($admin->fresh()->api_token_hash);
    }

    public function test_demo_account_flag_is_returned_during_login(): void
    {
        $user = User::factory()->create([
            'email' => 'demo-resident@example.com',
            'password' => 'password123',
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => true,
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.demo_mode', true);
    }

    public function test_database_seeder_marks_example_resident_as_demo(): void
    {
        $this->seed();

        $demoResident = User::query()->where('email', 'resident@example.com')->firstOrFail();

        $this->assertTrue($demoResident->demo_mode);
    }

    public function test_pending_user_cannot_log_in_through_the_api(): void
    {
        $user = User::factory()->create([
            'email' => 'pending@example.com',
            'password' => 'password123',
            'account_status' => 'pending',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertForbidden();
    }

    public function test_inactive_user_receives_deactivation_message(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => 'password123',
            'account_status' => 'inactive',
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertForbidden()
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('message', 'This account has been deactivated by the HOA administrator. Please contact the HOA for assistance.');
    }

    public function test_api_registration_creates_pending_user(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Resident',
            'email' => 'new-resident@example.com',
            'address' => 'Blk 3 Lot 12',
            'contact_number' => '09123456789',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('user.demo_mode', false);
        $this->assertDatabaseHas('users', [
            'email' => 'new-resident@example.com',
            'account_status' => 'pending',
            'role' => 'resident',
        ]);
        $this->assertDatabaseHas('resident_profiles', [
            'user_id' => $response->json('user.id'),
            'address' => 'Blk 3 Lot 12',
            'contact_number' => '09123456789',
        ]);
    }
}
