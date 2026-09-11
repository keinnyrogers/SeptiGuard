<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HoaApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_hoa_admin_can_view_pending_residents(): void
    {
        $admin = User::factory()->create(['role' => 'hoa_admin', 'account_status' => 'approved']);
        $resident = User::factory()->create([
            'name' => 'Pending Resident',
            'account_status' => 'pending',
            'role' => 'resident',
        ]);

        $response = $this->actingAs($admin)->get(route('hoa.users.pending'));

        $response->assertOk();
        $response->assertSee($resident->name);
    }

    public function test_resident_cannot_access_hoa_approval_page(): void
    {
        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);

        $response = $this->actingAs($resident)->get(route('hoa.users.pending'));

        $response->assertForbidden();
    }

    public function test_hoa_admin_can_approve_pending_resident(): void
    {
        $admin = User::factory()->create(['role' => 'hoa_admin', 'account_status' => 'approved']);
        $resident = User::factory()->create(['account_status' => 'pending', 'role' => 'resident']);

        $response = $this->actingAs($admin)->post(route('hoa.users.approve', $resident));

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $resident->id, 'account_status' => 'approved']);
    }

    public function test_hoa_admin_can_reject_pending_resident(): void
    {
        $admin = User::factory()->create(['role' => 'hoa_admin', 'account_status' => 'approved']);
        $resident = User::factory()->create(['account_status' => 'pending', 'role' => 'resident']);

        $response = $this->actingAs($admin)->post(route('hoa.users.reject', $resident));

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $resident->id, 'account_status' => 'rejected']);
    }

    public function test_hoa_admin_cannot_change_a_non_pending_account(): void
    {
        $admin = User::factory()->create(['role' => 'hoa_admin', 'account_status' => 'approved']);
        $resident = User::factory()->create(['account_status' => 'approved', 'role' => 'resident']);

        $response = $this->actingAs($admin)->post(route('hoa.users.reject', $resident));

        $response->assertNotFound();
        $this->assertDatabaseHas('users', ['id' => $resident->id, 'account_status' => 'approved']);
    }
}
