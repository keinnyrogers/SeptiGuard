<?php

namespace Tests\Feature;

use App\Models\ResidentInformationChangeRequest;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResidentInformationChangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_resident_can_submit_an_information_change_request(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 1 Lot 1',
            'contact_number' => '09123456789',
        ]);

        $this->withToken($this->tokenFor($resident))
            ->postJson('/api/resident/information-change-requests', [
                'field' => 'phone',
                'requested_value' => '09987654321',
                'reason' => 'I changed my number.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.field', 'phone')
            ->assertJsonPath('data.current_value', '09123456789')
            ->assertJsonPath('data.requested_value', '09987654321')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('resident_information_change_requests', [
            'user_id' => $resident->id,
            'field' => 'phone',
            'status' => 'pending',
        ]);
    }

    public function test_resident_cannot_submit_demo_or_duplicate_pending_requests(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => true,
        ]);
        $token = $this->tokenFor($resident);
        $payload = ['field' => 'name', 'requested_value' => 'New Name'];

        $this->withToken($token)
            ->postJson('/api/resident/information-change-requests', $payload)
            ->assertForbidden();

        $resident->update(['demo_mode' => false]);
        $this->withToken($token)
            ->postJson('/api/resident/information-change-requests', $payload)
            ->assertCreated();

        $this->withToken($token)
            ->postJson('/api/resident/information-change-requests', $payload)
            ->assertStatus(409);
    }

    public function test_hoa_admin_can_approve_a_request_and_apply_the_profile_change(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'name' => 'Old Name',
        ]);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 1 Lot 1',
            'contact_number' => '09123456789',
        ]);
        $changeRequest = ResidentInformationChangeRequest::query()->create([
            'user_id' => $resident->id,
            'field' => 'phone',
            'current_value' => '09123456789',
            'requested_value' => '09987654321',
        ]);
        $admin = User::factory()->create(['role' => 'hoa_admin']);

        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/admin/residents/information-change-requests')
            ->assertOk()
            ->assertJsonPath('data.0.resident.name', 'Old Name')
            ->assertJsonPath('data.0.field', 'phone');

        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/residents/information-change-requests/{$changeRequest->id}/review", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertSame('09987654321', $resident->residentProfile()->firstOrFail()->fresh()->contact_number);
        $this->assertSame($admin->id, $changeRequest->fresh()->reviewed_by);
    }

    public function test_hoa_admin_can_approve_an_address_change_request(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 1 Lot 1',
            'contact_number' => '09123456789',
        ]);
        $changeRequest = ResidentInformationChangeRequest::query()->create([
            'user_id' => $resident->id,
            'field' => 'address',
            'current_value' => 'Blk 1 Lot 1',
            'requested_value' => 'Blk 2 Lot 4',
        ]);
        $admin = User::factory()->create(['role' => 'hoa_admin']);

        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/residents/information-change-requests/{$changeRequest->id}/review", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.resident.address', 'Blk 2 Lot 4');

        $this->assertSame('Blk 2 Lot 4', $resident->residentProfile()->firstOrFail()->fresh()->address);
    }

    public function test_admin_cannot_approve_an_invalid_household_size_request(): void
    {
        $resident = User::factory()->create(['role' => 'resident', 'account_status' => 'approved']);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 1 Lot 1',
            'contact_number' => '09123456789',
        ]);
        $changeRequest = ResidentInformationChangeRequest::query()->create([
            'user_id' => $resident->id,
            'field' => 'household',
            'current_value' => '1',
            'requested_value' => 'not-a-number',
        ]);
        $admin = User::factory()->create(['role' => 'hoa_admin']);

        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/residents/information-change-requests/{$changeRequest->id}/review", [
                'status' => 'approved',
            ])
            ->assertUnprocessable();

        $this->assertSame('pending', $changeRequest->fresh()->status);
    }

    private function tokenFor(User $user): string
    {
        $token = 'information-change-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
