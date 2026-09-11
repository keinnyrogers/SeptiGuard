<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_from_dashboard(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_new_registration_waits_for_admin_approval(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test Resident',
            'email' => 'resident@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect('/registration-pending');
        $this->assertGuest();
        $this->assertDatabaseHas('users', [
            'email' => 'resident@example.com',
            'role' => 'resident',
            'account_status' => 'pending',
        ]);
    }

    public function test_pending_user_cannot_log_in(): void
    {
        $user = User::factory()->create([
            'email' => 'pending@example.com',
            'password' => 'password123',
            'account_status' => 'pending',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertRedirect('/registration-pending/pending');
        $this->assertGuest();
    }

    public function test_user_can_log_in_and_log_out(): void
    {
        $user = User::factory()->create([
            'email' => 'resident@example.com',
            'password' => 'password123',
            'account_status' => 'approved',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);

        $response = $this->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }
}
