<?php

namespace Tests\Feature;

use App\Models\SepticSystem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SensorReadingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sensor_can_store_a_reading(): void
    {
        $system = SepticSystem::factory()->create(['device_id' => 'ESP32-TEST-001']);

        $response = $this->withHeader('X-Sensor-Key', 'local-demo-sensor-key')->postJson('/api/sensor/readings', [
            'device_id' => 'ESP32-TEST-001',
            'fill_level_percentage' => 82,
            'distance_cm' => 42.5,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.septic_system_id', $system->id)
            ->assertJsonPath('data.status', 'critical')
            ->assertJsonPath('data.source', 'sensor');
        $this->assertDatabaseHas('tank_readings', [
            'septic_system_id' => $system->id,
            'fill_level_percentage' => 82,
            'status' => 'critical',
        ]);
    }

    public function test_sensor_status_follows_paper_thresholds(): void
    {
        $thresholds = [
            69 => 'normal',
            70 => 'warning',
            79 => 'warning',
            80 => 'critical',
        ];

        foreach ($thresholds as $fillLevel => $expectedStatus) {
            $system = SepticSystem::factory()->create([
                'device_id' => 'ESP32-TEST-'.$fillLevel,
            ]);

            $response = $this->withHeader('X-Sensor-Key', 'local-demo-sensor-key')->postJson('/api/sensor/readings', [
                'device_id' => $system->device_id,
                'fill_level_percentage' => $fillLevel,
            ]);

            $response->assertCreated()->assertJsonPath('data.status', $expectedStatus);
        }
    }

    public function test_resident_gets_one_notification_per_increasing_tank_alert_level(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);
        $system = SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'ESP32-ALERT-001',
        ]);

        foreach ([70, 75, 80, 85] as $level) {
            $this->withHeader('X-Sensor-Key', 'local-demo-sensor-key')->postJson('/api/sensor/readings', [
                'device_id' => $system->device_id,
                'fill_level_percentage' => $level,
            ])->assertCreated();
        }

        $this->assertDatabaseCount('septi_notifications', 2);
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'type' => 'warning_alert',
            'channel' => 'in_app',
            'is_read' => false,
        ]);
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'type' => 'critical_alert',
            'channel' => 'in_app',
            'is_read' => false,
        ]);

        $token = 'sensor-alert-test-token';
        $resident->forceFill(['api_token_hash' => hash('sha256', $token)])->save();
        $this->withToken($token)
            ->getJson('/api/resident/notifications')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['type' => 'critical_alert'])
            ->assertJsonFragment(['type' => 'warning_alert']);
    }

    public function test_demo_resident_does_not_get_sensor_notifications(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => true,
        ]);
        $system = SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'ESP32-DEMO-001',
        ]);

        $this->withHeader('X-Sensor-Key', 'local-demo-sensor-key')->postJson('/api/sensor/readings', [
            'device_id' => $system->device_id,
            'fill_level_percentage' => 85,
        ])->assertCreated();

        $this->assertDatabaseCount('septi_notifications', 0);
    }

    public function test_sensor_key_is_required(): void
    {
        $response = $this->postJson('/api/sensor/readings', [
            'device_id' => 'ESP32-TEST-001',
            'fill_level_percentage' => 50,
        ]);

        $response->assertUnauthorized();
    }

    public function test_invalid_sensor_reading_is_rejected(): void
    {
        $response = $this->withHeader('X-Sensor-Key', 'local-demo-sensor-key')->postJson('/api/sensor/readings', [
            'device_id' => 'ESP32-TEST-001',
            'fill_level_percentage' => 120,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['fill_level_percentage']);
    }

    public function test_decimal_reading_uses_calibrated_tank_height(): void
    {
        $system = SepticSystem::factory()->create([
            'device_id' => 'TNK-001',
            'tank_height_cm' => 110.45,
        ]);

        $response = $this->withHeader('X-Sensor-Key', 'local-demo-sensor-key')->postJson('/api/sensor/readings', [
            'device_id' => 'TNK-001',
            'fill_level_percentage' => 12.3,
            'distance_cm' => 42.5,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.fill_level_percentage', '61.52')
            ->assertJsonPath('data.status', 'normal');
        $this->assertDatabaseHas('tank_readings', [
            'septic_system_id' => $system->id,
            'fill_level_percentage' => 61.52,
        ]);
    }
}
