<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateHoaAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_approved_admin_without_seeding_demo_data(): void
    {
        $this->artisan('hoa-admin:create')
            ->expectsQuestion('Admin name', 'Hosted Administrator')
            ->expectsQuestion('Admin email', 'admin@example.com')
            ->expectsQuestion('Password (minimum 12 characters)', 'Use-a-long-test-password')
            ->expectsQuestion('Confirm password', 'Use-a-long-test-password')
            ->expectsOutput('HOA administrator created.')
            ->assertExitCode(0);

        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

        $this->assertSame('hoa_admin', $admin->role);
        $this->assertSame('approved', $admin->account_status);
        $this->assertFalse($admin->demo_mode);
        $this->assertTrue(password_verify('Use-a-long-test-password', $admin->password));
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('septic_systems', 0);
    }
}
