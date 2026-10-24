<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResidentPasswordResetNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_link_request_returns_the_same_confirmation_for_unknown_email(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'resident@example.test']);

        $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists for that email, a password reset link will be sent shortly.',
            );
        Notification::assertSentTo($user, ResidentPasswordResetNotification::class);
    }

    public function test_unknown_email_receives_same_confirmation_without_sending_notification(): void
    {
        Notification::fake();

        $this->postJson('/api/forgot-password', ['email' => 'unknown@example.test'])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists for that email, a password reset link will be sent shortly.',
            );
        Notification::assertNothingSent();
    }

    public function test_valid_reset_link_updates_password_and_invalidates_existing_api_token(): void
    {
        Notification::fake();
        $user = User::factory()->create([
            'email' => 'resident@example.test',
            'api_token_hash' => hash('sha256', 'old-api-token'),
        ]);

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $resetToken = null;
        Notification::assertSentTo(
            $user,
            ResidentPasswordResetNotification::class,
            function (ResidentPasswordResetNotification $notification) use (&$resetToken): bool {
                $resetToken = $notification->token;

                return true;
            },
        );
        $this->assertIsString($resetToken);

        $this->postJson('/api/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'new-resident-password',
            'password_confirmation' => 'new-resident-password',
        ])->assertOk()
            ->assertJsonPath('message', 'Your password has been reset. You can now sign in.');

        $user->refresh();
        $this->assertTrue(Hash::check('new-resident-password', $user->password));
        $this->assertNull($user->api_token_hash);
    }

    public function test_password_reset_rejects_a_mismatched_confirmation(): void
    {
        $this->postJson('/api/reset-password', [
            'token' => 'invalid',
            'email' => 'resident@example.test',
            'password' => 'new-resident-password',
            'password_confirmation' => 'different-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }
}
