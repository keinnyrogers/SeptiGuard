<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_resident_can_submit_maintenance_request(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $response = $this->actingAs($resident)->post(route('maintenance-requests.store'), [
            'title' => 'Tank inspection',
            'request_type' => 'inspection',
            'priority' => 'high',
            'description' => 'The septic tank needs a scheduled inspection.',
        ]);

        $response->assertRedirect(route('maintenance-requests.index'));
        $this->assertDatabaseHas('complaints', [
            'user_id' => $resident->id,
            'title' => 'Tank inspection',
            'status' => 'pending',
        ]);
    }

    public function test_pending_resident_cannot_submit_maintenance_request(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'pending',
        ]);

        $response = $this->actingAs($resident)->post(route('maintenance-requests.store'), [
            'title' => 'Tank inspection',
            'request_type' => 'inspection',
            'priority' => 'high',
            'description' => 'The septic tank needs a scheduled inspection.',
        ]);

        $response->assertForbidden();
    }

    public function test_hoa_admin_can_view_and_update_request_status(): void
    {
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $request = $resident->complaints()->create([
            'title' => 'Tank inspection',
            'ticket_code' => 'CMP-001',
            'category' => 'inspection',
            'priority' => 'high',
            'description' => 'Inspection needed',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->patch(route('hoa.maintenance-requests.update-status', $request), [
            'status' => 'in_progress',
        ]);

        $response->assertRedirect(route('hoa.maintenance-requests.index'));
        $this->assertDatabaseHas('complaints', [
            'id' => $request->id,
            'status' => 'in_progress',
        ]);
    }
}
