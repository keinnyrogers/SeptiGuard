<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\ResidentProfile;
use App\Models\SepticSystem;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminResidentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_hoa_admin_can_list_residents_with_bearer_token(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'pending']);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 3 Lot 12',
            'contact_number' => '09123456789',
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/residents')
            ->assertOk()
            ->assertJsonPath('data.0.email', $resident->email)
            ->assertJsonPath('data.0.block_lot', 'Blk 3 Lot 12');
    }

    public function test_resident_cannot_access_admin_resident_api(): void
    {
        $resident = $this->createApiUser('resident');

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($resident))
            ->getJson('/api/admin/residents')
            ->assertForbidden();
    }

    public function test_hoa_admin_can_create_an_approved_resident_account(): void
    {
        $admin = $this->createApiUser('hoa_admin');

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->postJson('/api/admin/residents', [
                'name' => 'Office Registration',
                'email' => 'office-resident@example.com',
                'address' => 'Blk 4 Lot 8',
                'contact_number' => '09123456789',
                'password' => 'temporary-password',
                'password_confirmation' => 'temporary-password',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Office Registration')
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.block_lot', 'Blk 4 Lot 8');

        $resident = User::query()->where('email', 'office-resident@example.com')->firstOrFail();
        $this->assertSame('resident', $resident->role);
        $this->assertSame('approved', $resident->account_status);
        $this->assertFalse($resident->demo_mode);
        $this->assertTrue(Hash::check('temporary-password', $resident->password));
        $this->assertDatabaseHas('resident_profiles', [
            'user_id' => $resident->id,
            'address' => 'Blk 4 Lot 8',
            'contact_number' => '09123456789',
        ]);
    }

    public function test_resident_cannot_create_resident_accounts(): void
    {
        $resident = $this->createApiUser('resident');

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($resident))
            ->postJson('/api/admin/residents', [])
            ->assertForbidden();
    }

    public function test_hoa_admin_can_view_real_tank_dashboard_data(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 3 Lot 12',
            'contact_number' => '09123456789',
        ]);
        $tank = SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'TNK-001',
            'capacity_liters' => 2750,
        ]);
        TankReading::factory()->create([
            'septic_system_id' => $tank->id,
            'fill_level_percentage' => 85,
            'status' => 'critical',
            'measured_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/tanks')
            ->assertOk()
            ->assertJsonPath('data.summary.total_tanks', 1)
            ->assertJsonPath('data.summary.critical_tanks', 1)
            ->assertJsonPath('data.tanks.0.id', 'TNK-001')
            ->assertJsonPath('data.tanks.0.capacity', 2750)
            ->assertJsonPath('data.tanks.0.level', 85)
            ->assertJsonPath('data.tanks.0.block', 3)
            ->assertJsonPath('data.tanks.0.lot', 12)
            ->assertJsonPath('data.tanks.0.forecast_status', 'threshold_reached')
            ->assertJsonPath('data.tanks.0.days_to_critical', 0);
    }

    public function test_rejected_resident_tanks_are_not_listed_as_active_admin_devices(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'rejected',
        ]);
        SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'REJECTED-001',
        ]);

        $headers = ['Authorization' => 'Bearer '.$this->tokenFor($admin)];

        $this->withHeaders($headers)
            ->getJson('/api/admin/tanks')
            ->assertOk()
            ->assertJsonCount(0, 'data.tanks');

        $this->withHeaders($headers)
            ->getJson('/api/admin/devices')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_hoa_admin_can_view_devices_and_complaints(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        $tank = SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'TNK-009',
            'firmware_version' => '1.0.0',
        ]);
        TankReading::factory()->create([
            'septic_system_id' => $tank->id,
            'measured_at' => now(),
            'status' => 'normal',
            'wifi_rssi_dbm' => -58,
        ]);
        $complaint = Complaint::query()->create([
            'user_id' => $resident->id,
            'ticket_code' => 'CMP-999',
            'title' => 'Tank inspection',
            'category' => 'septic_tank',
            'description' => 'Please inspect the tank.',
            'status' => 'pending',
        ]);
        $headers = ['Authorization' => 'Bearer '.$this->tokenFor($admin)];

        $this->withHeaders($headers)
            ->getJson('/api/admin/devices')
            ->assertOk()
            ->assertJsonPath('data.0.device_id', 'TNK-009')
            ->assertJsonPath('data.0.status', 'online')
            ->assertJsonPath('data.0.firmware', '1.0.0')
            ->assertJsonPath('data.0.signal', 'strong')
            ->assertJsonPath('data.0.signal_dbm', -58);

        $this->withHeaders($headers)
            ->getJson('/api/admin/complaints')
            ->assertOk()
            ->assertJsonPath('data.0.ticket_code', $complaint->ticket_code)
            ->assertJsonPath('data.0.tank_id', 'TNK-009');

        $this->withHeaders($headers)
            ->patchJson("/api/admin/complaints/{$complaint->id}/status", ['status' => 'resolved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');
    }

    public function test_admin_notifications_keep_open_complaints_visible_when_many_tanks_are_critical(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $resident = $this->createApiUser('resident');
        $complaint = $resident->complaints()->create([
            'ticket_code' => 'CMP-CRITICAL-001',
            'title' => 'Damaged tank cover',
            'category' => 'septic_tank',
            'description' => 'The tank cover is damaged.',
            'status' => 'pending',
        ]);

        foreach (range(1, 12) as $index) {
            $tank = SepticSystem::factory()->create([
                'user_id' => $this->createApiUser('resident')->id,
            ]);
            TankReading::factory()->create([
                'septic_system_id' => $tank->id,
                'fill_level_percentage' => 90,
                'measured_at' => now()->addSeconds($index),
            ]);
        }

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'complaint-'.$complaint->id,
                'type' => 'complaint',
                'title' => 'Open complaint '.$complaint->ticket_code,
            ]);
    }

    public function test_hoa_admin_can_mark_own_notifications_as_read(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $otherAdmin = $this->createApiUser('hoa_admin');
        $resident = $this->createApiUser('resident');
        $complaint = $resident->complaints()->create([
            'ticket_code' => 'CMP-READ-001',
            'title' => 'Check tank cover',
            'category' => 'septic_tank',
            'description' => 'The tank cover needs inspection.',
            'status' => 'pending',
        ]);
        $notificationId = 'complaint-'.$complaint->id;

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.id', $notificationId)
            ->assertJsonPath('data.0.unread', true);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->postJson("/api/admin/notifications/{$notificationId}/read")
            ->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.unread', false);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($otherAdmin))
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.unread', true);

        $this->assertDatabaseHas('admin_notification_reads', [
            'admin_user_id' => $admin->id,
            'notification_key' => $notificationId,
        ]);
    }

    public function test_admin_cannot_mark_a_notification_that_is_not_currently_available_as_read(): void
    {
        $admin = $this->createApiUser('hoa_admin');

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->postJson('/api/admin/notifications/complaint-999999/read')
            ->assertNotFound();
    }

    public function test_hoa_admin_can_register_device_without_optional_tank_details(): void
    {
        $admin = $this->createApiUser('hoa_admin');

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->postJson('/api/admin/devices', [
                'device_id' => 'TNK-OPTIONAL-001',
                'tank_type' => '',
                'capacity_liters' => '',
                'location' => '',
            ])
            ->assertCreated()
            ->assertJsonPath('data.device_id', 'TNK-OPTIONAL-001')
            ->assertJsonPath('data.status', 'offline');

        $this->assertDatabaseHas('septic_systems', [
            'device_id' => 'TNK-OPTIONAL-001',
            'tank_height_cm' => null,
            'tank_type' => null,
            'capacity_liters' => null,
            'location' => null,
            'user_id' => null,
        ]);
    }

    public function test_admin_can_approve_or_reject_pending_residents(): void
    {
        $admin = $this->createApiUser('hoa_admin');
        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'pending']);
        $headers = ['Authorization' => 'Bearer '.$this->tokenFor($admin)];

        $this->withHeaders($headers)
            ->patchJson("/api/admin/residents/{$resident->id}/approval", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('users', ['id' => $resident->id, 'account_status' => 'approved']);

        $secondResident = User::factory()->create(['role' => 'resident', 'account_status' => 'pending']);
        $this->withHeaders($headers)
            ->patchJson("/api/admin/residents/{$secondResident->id}/approval", ['status' => 'rejected'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('users', ['id' => $secondResident->id, 'account_status' => 'rejected']);
    }

    public function test_approval_api_requires_a_valid_bearer_token(): void
    {
        $this->getJson('/api/admin/residents')->assertUnauthorized();

        $this->withHeader('Authorization', 'Bearer invalid-token')
            ->getJson('/api/admin/residents')
            ->assertUnauthorized();
    }

    public function test_localhost_vite_port_is_allowed_by_api_cors(): void
    {
        $response = $this->call('OPTIONS', '/api/admin/residents', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:5175',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ]);

        $response->assertStatus(204)
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5175');
    }

    private function createApiUser(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'account_status' => 'approved',
        ]);
    }

    private function tokenFor(User $user): string
    {
        $token = 'test-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
