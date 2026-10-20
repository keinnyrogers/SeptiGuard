<?php

namespace Tests\Feature;

use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResidentAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_fetch_their_latest_account_and_profile_details(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 1 Lot 1',
            'contact_number' => '09987654321',
        ]);

        $this->withToken($this->tokenFor($resident))
            ->getJson('/api/resident/account')
            ->assertOk()
            ->assertJsonPath('data.id', $resident->id)
            ->assertJsonPath('data.resident_profile.contact_number', '09987654321');
    }

    public function test_resident_can_change_password(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'password' => 'old-password',
        ]);

        $response = $this->withToken($this->tokenFor($resident))
            ->putJson('/api/resident/password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertOk()->assertJsonPath('message', 'Password updated successfully.');
        $this->assertTrue(Hash::check('new-password', $resident->fresh()->password));
    }

    public function test_resident_cannot_change_password_with_wrong_current_password(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'password' => 'old-password',
        ]);

        $this->withToken($this->tokenFor($resident))
            ->putJson('/api/resident/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');
    }

    public function test_sms_preference_endpoints_are_removed(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        $this->withToken($this->tokenFor($resident))
            ->getJson('/api/resident/notification-preferences')
            ->assertNotFound();

        $this->withToken($this->tokenFor($resident))
            ->patchJson('/api/resident/notification-preferences', [
                'sms_notifications_enabled' => true,
            ])
            ->assertNotFound();
    }

    public function test_resident_can_upload_and_view_their_private_profile_photo(): void
    {
        Storage::fake('local');
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        ResidentProfile::query()->create([
            'user_id' => $resident->id,
            'address' => 'Blk 1 Lot 1',
            'contact_number' => '09123456789',
        ]);
        $token = $this->tokenFor($resident);

        $upload = $this->withToken($token)
            ->post('/api/resident/profile/photo', [
                'photo' => UploadedFile::fake()->createWithContent(
                    'profile.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='),
                ),
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Profile photo updated.');

        $path = $upload->json('data.profile_photo_path');
        $this->assertNotEmpty($path);
        Storage::disk('local')->assertExists($path);

        $this->withToken($token)
            ->get('/api/resident/profile/photo')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');

        $otherResident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
        ]);
        ResidentProfile::query()->create([
            'user_id' => $otherResident->id,
            'address' => 'Blk 2 Lot 2',
            'contact_number' => '09123456780',
        ]);
        $this->withToken($this->tokenFor($otherResident))
            ->get('/api/resident/profile/photo')
            ->assertNotFound();
    }

    public function test_resident_profile_photo_upload_rejects_non_images(): void
    {
        Storage::fake('local');
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
            ->post('/api/resident/profile/photo', [
                'photo' => UploadedFile::fake()->create('notes.txt', 2, 'text/plain'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('photo');
    }

    private function tokenFor(User $user): string
    {
        $token = 'account-test-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
