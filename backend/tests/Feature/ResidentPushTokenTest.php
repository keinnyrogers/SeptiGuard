<?php

namespace Tests\Feature;

use App\Models\ResidentPushToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResidentPushTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_resident_can_register_and_check_their_push_token(): void
    {
        $resident = $this->resident();
        $token = 'resident-device-push-token';

        $this->withToken($resident['token'])
            ->postJson('/api/resident/push/tokens', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('message', 'Push notifications enabled for this device.');

        $this->withToken($resident['token'])
            ->postJson('/api/resident/push/status', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.enabled', true);

        $this->assertDatabaseHas('resident_push_tokens', [
            'user_id' => $resident['user']->id,
            'token_hash' => hash('sha256', $token),
        ]);
    }

    public function test_a_push_token_cannot_be_taken_over_by_another_resident(): void
    {
        $firstResident = $this->resident();
        $secondResident = $this->resident();
        $token = 'shared-device-push-token';

        $this->withToken($firstResident['token'])
            ->postJson('/api/resident/push/tokens', ['token' => $token])
            ->assertOk();

        $this->withToken($secondResident['token'])
            ->postJson('/api/resident/push/tokens', ['token' => $token])
            ->assertConflict();

        $this->assertDatabaseHas('resident_push_tokens', [
            'user_id' => $firstResident['user']->id,
            'token_hash' => hash('sha256', $token),
        ]);
    }

    public function test_demo_accounts_cannot_register_push_tokens(): void
    {
        $resident = $this->resident(['demo_mode' => true]);

        $this->withToken($resident['token'])
            ->postJson('/api/resident/push/tokens', ['token' => 'demo-device-token'])
            ->assertForbidden();

        $this->assertDatabaseCount('resident_push_tokens', 0);
    }

    public function test_resident_can_remove_only_their_own_push_token(): void
    {
        $resident = $this->resident();
        $otherResident = $this->resident();
        $ownToken = 'own-device-push-token';
        $otherToken = 'other-device-push-token';

        $ownRecord = ResidentPushToken::query()->create([
            'user_id' => $resident['user']->id,
            'token' => $ownToken,
            'token_hash' => hash('sha256', $ownToken),
        ]);
        ResidentPushToken::query()->create([
            'user_id' => $otherResident['user']->id,
            'token' => $otherToken,
            'token_hash' => hash('sha256', $otherToken),
        ]);

        $this->withToken($resident['token'])
            ->deleteJson('/api/resident/push/tokens', ['token' => $ownToken])
            ->assertOk();

        $this->assertDatabaseMissing('resident_push_tokens', ['id' => $ownRecord->id]);
        $this->assertDatabaseHas('resident_push_tokens', [
            'user_id' => $otherResident['user']->id,
            'token_hash' => hash('sha256', $otherToken),
        ]);
    }

    private function resident(array $attributes = []): array
    {
        $user = User::factory()->create(array_merge([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ], $attributes));
        $token = 'resident-api-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return ['user' => $user, 'token' => $token];
    }
}
