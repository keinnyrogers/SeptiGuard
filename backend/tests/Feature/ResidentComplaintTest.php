<?php

namespace Tests\Feature;

use App\Jobs\DeliverResidentNotification;
use App\Models\Complaint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResidentComplaintTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_submit_a_complaint_with_a_photo(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $response = $this->withToken($this->tokenFor($resident))
            ->post('/api/resident/complaints', [
                'category' => 'septic_tank',
                'title' => 'Tank leak',
                'description' => 'Water is leaking near the tank.',
                'photo' => UploadedFile::fake()->createWithContent(
                    'leak.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXUAAAAASUVORK5CYII='),
                ),
            ]);

        $complaint = Complaint::query()->firstOrFail();
        $response->assertCreated()
            ->assertJsonPath('data.title', 'Tank leak')
            ->assertJsonMissingPath('data.priority')
            ->assertJsonPath('data.photo_url', route('api.resident.complaints.photo', $complaint->id, false));
        $this->assertFalse(Schema::hasColumn('complaints', 'priority'));

        $this->assertNotNull($complaint->photo_path);
        Storage::disk('local')->assertExists($complaint->photo_path);
        Storage::disk('public')->assertMissing($complaint->photo_path);
        $this->withToken($this->tokenFor($resident))
            ->get($response->json('data.photo_url'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_complaint_photos_are_private_and_admin_access_requires_hoa_role(): void
    {
        Storage::fake('local');
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $otherResident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);

        $response = $this->withToken($this->tokenFor($resident))
            ->post('/api/resident/complaints', [
                'category' => 'septic_tank',
                'title' => 'Tank leak',
                'description' => 'Water is leaking near the tank.',
                'photo' => UploadedFile::fake()->createWithContent(
                    'leak.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXUAAAAASUVORK5CYII='),
                ),
            ]);
        $response->assertCreated()
            ->assertJsonMissingPath('data.priority');
        $complaintId = $response->json('data.id');

        $this->withToken($this->tokenFor($otherResident))
            ->get(route('api.resident.complaints.photo', $complaintId))
            ->assertNotFound();

        $this->withToken($this->tokenFor($resident))
            ->get(route('api.admin.complaints.photo', $complaintId))
            ->assertForbidden();

        $this->withToken($this->tokenFor($admin))
            ->get(route('api.admin.complaints.photo', $complaintId))
            ->assertOk();
    }

    public function test_resident_can_see_hoa_response_saved_by_admin(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);
        $complaint = $resident->complaints()->create([
            'title' => 'Tank leak',
            'ticket_code' => 'CMP-101',
            'category' => 'septic_tank',
            'description' => 'Water is leaking near the tank.',
            'status' => 'pending',
        ]);

        $this->withToken($this->tokenFor($admin))
            ->patchJson(route('api.admin.complaints.status', $complaint), [
                'status' => 'in_progress',
                'hoa_response' => 'A technician will inspect the tank tomorrow.',
            ])
            ->assertOk()
            ->assertJsonPath('data.hoa_response', 'A technician will inspect the tank tomorrow.');
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'type' => 'ticket_update',
            'channel' => 'in_app',
            'is_read' => false,
        ]);

        $this->withToken($this->tokenFor($resident))
            ->getJson('/api/resident/complaints')
            ->assertOk()
            ->assertJsonPath('data.0.hoa_response', 'A technician will inspect the tank tomorrow.');

        $this->withToken($this->tokenFor($admin))
            ->patchJson(route('api.admin.complaints.status', $complaint), [
                'status' => 'in_progress',
                'hoa_response' => 'A technician will inspect the tank tomorrow.',
            ])
            ->assertOk();
        $this->assertDatabaseCount('septi_notifications', 1);
    }

    public function test_hoa_updates_queue_email_without_exposing_delivery_rows_in_app(): void
    {
        Queue::fake();
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.username' => 'hoa@example.com',
            'mail.mailers.smtp.password' => 'app-password',
            'mail.from.address' => 'hoa@example.com',
        ]);
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $admin = User::factory()->create([
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);
        $complaint = $resident->complaints()->create([
            'title' => 'Tank leak',
            'ticket_code' => 'CMP-102',
            'category' => 'septic_tank',
            'description' => 'Water is leaking near the tank.',
            'status' => 'pending',
        ]);

        $this->withToken($this->tokenFor($admin))
            ->patchJson(route('api.admin.complaints.status', $complaint), [
                'status' => 'in_progress',
                'hoa_response' => 'A technician will inspect the tank tomorrow.',
            ])
            ->assertOk();

        Queue::assertPushed(DeliverResidentNotification::class, 1);
        $this->assertDatabaseCount('septi_notifications', 2);

        $residentToken = $this->tokenFor($resident);
        $this->withToken($residentToken)
            ->getJson('/api/resident/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withToken($residentToken)
            ->postJson('/api/resident/notifications/read')
            ->assertOk();
        $this->assertDatabaseHas('septi_notifications', [
            'user_id' => $resident->id,
            'channel' => 'email',
            'is_read' => true,
        ]);
        $this->assertDatabaseMissing('septi_notifications', [
            'user_id' => $resident->id,
            'channel' => 'sms',
        ]);
    }

    public function test_resident_complaint_rejects_non_image_attachments(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);

        $this->withToken($this->tokenFor($resident))
            ->post('/api/resident/complaints', [
                'category' => 'septic_tank',
                'title' => 'Tank leak',
                'description' => 'Water is leaking near the tank.',
                'photo' => UploadedFile::fake()->create('notes.txt', 2, 'text/plain'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('photo');
    }

    private function tokenFor(User $user): string
    {
        $token = 'resident-complaint-test-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
