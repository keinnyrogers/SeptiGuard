<?php

namespace Tests\Feature;

use App\Console\Commands\MqttListenCommand;
use App\Models\SepticSystem;
use App\Models\User;
use App\Services\SensorReadingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\TestCase;

class MqttListenCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_listener_preserves_simulated_reading_source(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);
        $system = SepticSystem::factory()->create([
            'device_id' => 'TNK-SIMULATED',
            'user_id' => $resident->id,
        ]);

        $this->processMessage([
            'device_id' => $system->device_id,
            'distance_cm' => 75,
            'fill_level_percentage' => 85,
            'source' => 'simulated',
        ]);

        $this->assertDatabaseHas('tank_readings', [
            'septic_system_id' => $system->id,
            'distance_cm' => 75,
            'source' => 'simulated',
        ]);
        $this->assertDatabaseCount('septi_notifications', 0);
    }

    public function test_listener_defaults_legacy_payloads_to_sensor_source(): void
    {
        $system = SepticSystem::factory()->create(['device_id' => 'TNK-LEGACY']);

        $this->processMessage([
            'device_id' => $system->device_id,
            'distance_cm' => 75,
        ]);

        $this->assertDatabaseHas('tank_readings', [
            'septic_system_id' => $system->id,
            'distance_cm' => 75,
            'source' => 'sensor',
        ]);
    }

    public function test_listener_saves_reported_firmware_version_to_device(): void
    {
        $system = SepticSystem::factory()->create(['device_id' => 'TNK-FIRMWARE']);

        $this->processMessage([
            'device_id' => $system->device_id,
            'distance_cm' => 75,
            'firmware_version' => '1.0.0',
        ]);

        $this->assertDatabaseHas('septic_systems', [
            'id' => $system->id,
            'firmware_version' => '1.0.0',
        ]);
        $this->assertDatabaseCount('tank_readings', 1);
    }

    public function test_listener_rejects_unknown_reading_source(): void
    {
        $system = SepticSystem::factory()->create(['device_id' => 'TNK-INVALID-SOURCE']);

        $this->processMessage([
            'device_id' => $system->device_id,
            'distance_cm' => 75,
            'source' => 'unknown',
        ]);

        $this->assertDatabaseCount('tank_readings', 0);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function processMessage(array $payload): void
    {
        $command = app(MqttListenCommand::class);
        $method = new ReflectionMethod($command, 'processMessage');
        $method->invoke(
            $command,
            'test-topic',
            json_encode($payload, JSON_THROW_ON_ERROR),
            app(SensorReadingService::class),
        );
    }
}
