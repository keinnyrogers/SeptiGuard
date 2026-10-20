<?php

namespace Tests\Feature;

use App\Jobs\DeliverResidentNotification;
use App\Models\SeptiNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ResidentNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_mark_only_their_own_notification_as_read(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $otherResident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $notification = SeptiNotification::factory()->create([
            'user_id' => $resident->id,
            'channel' => 'in_app',
            'is_read' => false,
        ]);
        $otherNotification = SeptiNotification::factory()->create([
            'user_id' => $otherResident->id,
            'channel' => 'in_app',
            'is_read' => false,
        ]);
        $token = 'resident-notification-test-token';
        $resident->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        $this->withToken($token)
            ->postJson("/api/resident/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('message', 'Notification marked as read.');

        $this->assertTrue($notification->fresh()->is_read);
        $this->assertFalse($otherNotification->fresh()->is_read);

        $this->withToken($token)
            ->postJson("/api/resident/notifications/{$otherNotification->id}/read")
            ->assertNotFound();
    }

    public function test_legacy_sms_job_is_discarded_without_sending(): void
    {
        Http::fake();
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $notification = SeptiNotification::factory()->create([
            'user_id' => $resident->id,
            'channel' => 'sms',
            'title' => 'Tank warning',
            'message' => 'Tank reached warning level.',
            'is_sent' => false,
            'sent_at' => null,
        ]);

        (new DeliverResidentNotification($notification->id))->handle();

        Http::assertNothingSent();
        $this->assertDatabaseMissing('septi_notifications', ['id' => $notification->id]);
    }
}
