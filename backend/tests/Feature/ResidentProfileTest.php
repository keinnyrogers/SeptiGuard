<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResidentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_resident_can_view_profile_form(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $response = $this->actingAs($resident)->get(route('resident-profile.edit'));

        $response->assertOk();
        $response->assertSee('Resident profile');
    }

    public function test_approved_resident_can_save_profile_details(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $response = $this->actingAs($resident)->put(route('resident-profile.update'), [
            'address' => '123 Sample Street',
            'contact_number' => '09123456789',
            'household_members' => 4,
            'notes' => 'Family household',
        ]);

        $response->assertRedirect(route('resident-profile.edit'));
        $this->assertDatabaseHas('resident_profiles', [
            'user_id' => $resident->id,
            'address' => '123 Sample Street',
            'contact_number' => '09123456789',
            'household_members' => 4,
        ]);
    }

    public function test_pending_resident_cannot_access_profile_form(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'pending',
        ]);

        $response = $this->actingAs($resident)->get(route('resident-profile.edit'));

        $response->assertForbidden();
    }
}
