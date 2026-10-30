<?php

namespace Tests\Feature;

use App\Jobs\SendResidentUpdateEmail;
use App\Models\ResidentInformationChangeRequest;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
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
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'title' => 'Information change request received',
            'channel' => 'in_app',
            'is_read' => false,
        ]);
    }

    public function test_admin_receives_an_unread_notification_for_a_pending_information_change_request(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'name' => 'Alex Resident',
        ]);
        $admin = User::factory()->create(['role' => 'hoa_admin']);
        $request = ResidentInformationChangeRequest::query()->create([
            'user_id' => $resident->id,
            'field' => 'address',
            'current_value' => 'Blk 1 Lot 1',
            'requested_value' => 'Blk 2 Lot 4',
            'status' => 'pending',
        ]);
        $token = $this->tokenFor($admin);
        $notificationId = 'information-change-'.$request->id;

        $this->withToken($token)
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $notificationId,
                'type' => 'information_change',
                'title' => 'Resident information change request',
                'detail' => 'Alex Resident requested a change to their address.',
                'path' => '/admin/residents',
                'unread' => true,
            ]);

        $this->withToken($token)
            ->postJson("/api/admin/notifications/{$notificationId}/read")
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $notificationId,
                'unread' => false,
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
        Queue::fake();
        $this->configureSmtp();
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
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
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('message', 'Request approved. Resident email queued.');

        $this->assertSame('09987654321', $resident->residentProfile()->firstOrFail()->fresh()->contact_number);
        $this->assertSame($admin->id, $changeRequest->fresh()->reviewed_by);
        Queue::assertPushed(
            SendResidentUpdateEmail::class,
            fn (SendResidentUpdateEmail $job): bool => $job->residentEmail === $resident->email
                && str_contains($job->message, 'approved'),
        );
    }

    public function test_hoa_admin_can_reject_a_request_and_queue_a_resident_email(): void
    {
        Queue::fake();
        $this->configureSmtp();
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);
        $changeRequest = ResidentInformationChangeRequest::query()->create([
            'user_id' => $resident->id,
            'field' => 'address',
            'current_value' => 'Blk 1 Lot 1',
            'requested_value' => 'Blk 8 Lot 9',
        ]);
        $admin = User::factory()->create(['role' => 'hoa_admin']);

        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/residents/information-change-requests/{$changeRequest->id}/review", [
                'status' => 'rejected',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('message', 'Request rejected. Resident email queued.');

        Queue::assertPushed(
            SendResidentUpdateEmail::class,
            fn (SendResidentUpdateEmail $job): bool => $job->residentEmail === $resident->email
                && str_contains($job->message, 'declined'),
        );
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

    private function configureSmtp(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.example.com',
            'mail.mailers.smtp.username' => 'hoa@example.com',
            'mail.mailers.smtp.password' => 'test-password',
            'mail.from.address' => 'hoa@example.com',
        ]);
    }
}
