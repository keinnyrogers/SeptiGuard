<?php

namespace Tests\Feature;

use App\Models\SepticSystem;
use App\Models\TankDesludging;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTankDesludgingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_record_completed_desludging_without_changing_readings(): void
    {
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);
        $token = 'desludging-admin-token';
        $admin->forceFill(['api_token_hash' => hash('sha256', $token)])->save();
        $system = SepticSystem::factory()->create(['device_id' => 'TNK-DESLUDGING']);
        $reading = $system->tankReadings()->create([
            'fill_level_percentage' => 62.5,
            'measured_at' => now()->subDay(),
            'source' => 'sensor',
            'status' => 'normal',
        ]);

        $this->withToken($token)
            ->postJson("/api/admin/tanks/{$system->id}/desludgings", [
                'performed_on' => now()->subDay()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.performed_on', now()->subDay()->toDateString());

        $this->assertDatabaseHas('tank_desludgings', [
            'septic_system_id' => $system->id,
            'performed_on' => now()->subDay()->toDateString().' 00:00:00',
            'recorded_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('tank_readings', [
            'id' => $reading->id,
            'fill_level_percentage' => 62.5,
        ]);
    }

    public function test_admin_cannot_record_a_future_or_earlier_than_latest_desludging_date(): void
    {
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);
        $token = 'desludging-validation-token';
        $admin->forceFill(['api_token_hash' => hash('sha256', $token)])->save();
        $system = SepticSystem::factory()->create();
        TankDesludging::query()->create([
            'septic_system_id' => $system->id,
            'performed_on' => now()->subDay()->toDateString(),
            'recorded_by' => $admin->id,
        ]);

        $this->withToken($token)
            ->postJson("/api/admin/tanks/{$system->id}/desludgings", [
                'performed_on' => now()->subDays(2)->toDateString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('performed_on');

        $this->withToken($token)
            ->postJson("/api/admin/tanks/{$system->id}/desludgings", [
                'performed_on' => now()->addDay()->toDateString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('performed_on');
    }

    public function test_admin_can_schedule_service_and_resident_sees_status_updates(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);
        $system = SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'TNK-DISPATCH',
            'location' => 'Blk 5 Lot 3',
        ]);
        $adminToken = 'dispatch-admin-token';
        $admin->forceFill(['api_token_hash' => hash('sha256', $adminToken)])->save();
        $residentToken = 'dispatch-resident-token';
        $resident->forceFill(['api_token_hash' => hash('sha256', $residentToken)])->save();
        $scheduledFor = now()->addDays(2)->toDateString();

        $response = $this->withToken($adminToken)
            ->postJson("/api/admin/tanks/{$system->id}/dispatch", [
                'scheduled_for' => $scheduledFor,
            ])
            ->assertCreated()
            ->assertJsonPath('data.scheduled_for', $scheduledFor)
            ->assertJsonPath('data.status', 'pending');

        $complaintId = $response->json('data.id');
        $this->assertDatabaseHas('complaints', [
            'id' => $complaintId,
            'user_id' => $resident->id,
            'category' => 'septic_tank',
            'title' => 'Maintenance request: Desludging service for TNK-DISPATCH',
            'scheduled_for' => $scheduledFor.' 00:00:00',
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'title' => 'Desludging scheduled for '.\Illuminate\Support\Carbon::parse($scheduledFor)->toFormattedDateString(),
            'type' => 'ticket_update',
            'channel' => 'in_app',
        ]);

        $this->withToken($adminToken)
            ->patchJson("/api/admin/complaints/{$complaintId}/status", [
                'status' => 'in_progress',
                'hoa_response' => 'The crew is on the way.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->withToken($residentToken)
            ->getJson('/api/resident/complaints')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'in_progress')
            ->assertJsonPath('data.0.scheduled_for', $scheduledFor)
            ->assertJsonPath('data.0.hoa_response', 'The crew is on the way.');
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'title' => 'Desludging service In progress',
            'type' => 'ticket_update',
            'channel' => 'in_app',
        ]);
    }
}
