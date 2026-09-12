<?php

namespace Tests\Feature;

use App\Models\SepticSystem;
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
}
