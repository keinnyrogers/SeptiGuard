<?php

namespace Tests\Feature;

use App\Models\SepticSystem;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResidentTankHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_tank_response_includes_daily_averages_for_recent_history(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $system = SepticSystem::factory()->create(['user_id' => $resident->id]);
        TankReading::factory()->create([
            'septic_system_id' => $system->id,
            'fill_level_percentage' => 40,
            'measured_at' => now()->subDay()->setTime(15, 0),
        ]);
        TankReading::factory()->create([
            'septic_system_id' => $system->id,
            'fill_level_percentage' => 50,
            'measured_at' => now()->setTime(15, 0),
        ]);

        $this->withToken($this->tokenFor($resident))
            ->getJson('/api/resident/tank/latest')
            ->assertOk()
            ->assertJsonCount(2, 'data.history')
            ->assertJsonPath('data.history.0.date_key', now()->subDay()->toDateString())
            ->assertJsonPath('data.history.0.value', 40)
            ->assertJsonPath('data.history.1.date_key', now()->toDateString())
            ->assertJsonPath('data.history.1.value', 50);
    }

    private function tokenFor(User $user): string
    {
        $token = 'test-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
