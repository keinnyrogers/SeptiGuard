<?php

namespace Tests\Feature;

use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
