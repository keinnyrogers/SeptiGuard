<?php

namespace Tests\Feature;

use App\Models\SepticSystem;
use App\Models\User;
use App\Services\MqttDeviceConfigPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpMqtt\Client\Exceptions\MqttClientException;
use Tests\TestCase;

class ResidentDevicePairingTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_pair_an_unassigned_device(): void
    {
        $this->mock(MqttDeviceConfigPublisher::class)
            ->shouldReceive('publishTankHeight')
            ->once()
            ->with('TNK-001', 315.5);

        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        $system = SepticSystem::factory()->create([
            'user_id' => null,
            'device_id' => 'TNK-001',
            'tank_height_cm' => null,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($resident))
            ->postJson('/api/resident/tank/pair', [
                'device_id' => 'TNK-001',
                'tank_height_cm' => 315.5,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.device_id', 'TNK-001')
            ->assertJsonPath('data.tank_height_cm', '315.50');
        $this->assertDatabaseHas('septic_systems', [
            'id' => $system->id,
            'user_id' => $resident->id,
            'tank_height_cm' => 315.5,
        ]);
    }

    public function test_resident_cannot_pair_another_residents_device(): void
    {
        $this->mock(MqttDeviceConfigPublisher::class)
            ->shouldNotReceive('publishTankHeight');

        $owner = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        $otherResident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        SepticSystem::factory()->create([
            'user_id' => $owner->id,
            'device_id' => 'TNK-001',
            'tank_height_cm' => 315.5,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($otherResident))
            ->postJson('/api/resident/tank/pair', [
                'device_id' => 'TNK-001',
                'tank_height_cm' => 315.5,
            ])
            ->assertStatus(409);
    }

    public function test_resident_must_enter_valid_tank_height_when_pairing(): void
    {
        $this->mock(MqttDeviceConfigPublisher::class)
            ->shouldNotReceive('publishTankHeight');

        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        $system = SepticSystem::factory()->create([
            'user_id' => null,
            'device_id' => 'TNK-NO-HEIGHT',
            'tank_height_cm' => null,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($resident))
            ->postJson('/api/resident/tank/pair', [
                'device_id' => $system->device_id,
                'tank_height_cm' => 10,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tank_height_cm');

        $this->assertDatabaseHas('septic_systems', [
            'id' => $system->id,
            'user_id' => null,
            'tank_height_cm' => null,
        ]);
    }

    public function test_pairing_reports_when_mqtt_height_publish_fails_after_saving_pairing(): void
    {
        $this->mock(MqttDeviceConfigPublisher::class)
            ->shouldReceive('publishTankHeight')
            ->once()
            ->with('TNK-MQTT-FAIL', 315.5)
            ->andThrow(new MqttClientException('Broker unavailable.'));

        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        $system = SepticSystem::factory()->create([
            'user_id' => null,
            'device_id' => 'TNK-MQTT-FAIL',
            'tank_height_cm' => null,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($resident))
            ->postJson('/api/resident/tank/pair', [
                'device_id' => $system->device_id,
                'tank_height_cm' => 315.5,
            ])
            ->assertStatus(503)
            ->assertJsonPath('message', 'The device was paired, but its height could not be sent. Please try pairing again while the MQTT broker is available.');

        $this->assertDatabaseHas('septic_systems', [
            'id' => $system->id,
            'user_id' => $resident->id,
            'tank_height_cm' => 315.5,
        ]);
    }

    private function tokenFor(User $user): string
    {
        $token = 'pairing-test-token';
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
