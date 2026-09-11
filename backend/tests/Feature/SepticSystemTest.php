<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SepticSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_resident_can_view_septic_system_form(): void
    {
        $resident = User::factory()->create(['account_status' => 'approved', 'role' => 'resident']);

        $response = $this->actingAs($resident)->get(route('septic-system.edit'));

        $response->assertOk();
        $response->assertSee('Register your septic system');
    }

    public function test_approved_resident_can_save_septic_system_details(): void
    {
        $resident = User::factory()->create(['account_status' => 'approved', 'role' => 'resident']);

        $response = $this->actingAs($resident)->put(route('septic-system.update'), [
            'tank_type' => 'Concrete',
            'capacity_liters' => 5000,
            'installation_date' => '2024-01-15',
            'last_maintenance_date' => '2026-01-20',
            'location' => 'Back yard',
        ]);

        $response->assertRedirect(route('septic-system.edit'));
        $this->assertDatabaseHas('septic_systems', [
            'user_id' => $resident->id,
            'tank_type' => 'Concrete',
            'capacity_liters' => 5000,
            'location' => 'Back yard',
        ]);
    }

    public function test_pending_resident_cannot_access_septic_system_form(): void
    {
        $resident = User::factory()->create(['account_status' => 'pending', 'role' => 'resident']);

        $response = $this->actingAs($resident)->get(route('septic-system.edit'));

        $response->assertForbidden();
    }

    public function test_septic_system_details_require_valid_values(): void
    {
        $resident = User::factory()->create(['account_status' => 'approved', 'role' => 'resident']);

        $response = $this->actingAs($resident)->put(route('septic-system.update'), [
            'tank_type' => '',
            'capacity_liters' => 0,
            'installation_date' => now()->addDay()->toDateString(),
            'location' => '',
        ]);

        $response->assertSessionHasErrors(['tank_type', 'capacity_liters', 'installation_date', 'location']);
    }
}
