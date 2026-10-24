<?php

namespace App\Jobs;

use App\Models\ResidentPushToken;
use App\Models\SeptiNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use RuntimeException;

class DeliverResidentPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $notificationId) {}

    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(): void
    {
        $notification = SeptiNotification::query()
            ->with('user')
            ->findOrFail($this->notificationId);
        $resident = $notification->user;

        if ($notification->is_sent) {
            return;
        }

        if (
            $notification->channel !== 'fcm'
            || $resident->role !== 'resident'
            || $resident->account_status !== 'approved'
            || $resident->demo_mode
        ) {
            Log::warning('Push notification cancelled because its channel or account is not eligible.', [
                'notification_id' => $notification->id,
                'user_id' => $resident->id,
            ]);
            $notification->delete();

            return;
        }

        $credentials = config('services.firebase.credentials');
        if (! is_string($credentials) || $credentials === '' || ! is_file($credentials)) {
            throw new RuntimeException('Firebase Admin credentials are not configured.');
        }

        $tokens = $resident->residentPushTokens()->pluck('token')->all();
        if ($tokens === []) {
            $notification->forceFill(['is_sent' => true, 'sent_at' => now()])->save();

            return;
        }

        $messaging = (new Factory())->withServiceAccount($credentials)->createMessaging();
        $message = CloudMessage::new()
            ->withData([
                'notification_id' => (string) $notification->id,
                'title' => $notification->title,
                'body' => $notification->message,
                'url' => '/alerts',
            ]);
        $failedTokens = [];
        $hasRetryableFailure = false;
        $retryableFailures = [];

        foreach (array_chunk($tokens, 500) as $tokenBatch) {
            $report = $messaging->sendMulticast($message, $tokenBatch);
            $failedTokens = array_merge(
                $failedTokens,
                $report->invalidTokens(),
                $report->unknownTokens(),
            );
            foreach ($report->failures()->getItems() as $failure) {
                if (! $failure->messageTargetWasInvalid() && ! $failure->messageWasSentToUnknownToken()) {
                    $hasRetryableFailure = true;
                    $error = $failure->error();
                    $retryableFailures[] = [
                        'type' => $error ? $error::class : 'unknown',
                        'code' => $error?->getCode(),
                        'message' => $error?->getMessage() ?? 'Unknown Firebase delivery failure.',
                    ];
                }
            }
        }

        if ($failedTokens !== []) {
            $failedHashes = array_map(
                static fn (string $failedToken): string => hash('sha256', $failedToken),
                array_unique($failedTokens),
            );
            ResidentPushToken::query()->whereIn('token_hash', $failedHashes)->delete();
        }

        if ($hasRetryableFailure) {
            Log::warning('Firebase rejected one or more resident push notifications.', [
                'notification_id' => $notification->id,
                'failures' => $retryableFailures,
            ]);
            throw new RuntimeException('Firebase could not deliver the notification to one or more devices.');
        }

        $notification->forceFill(['is_sent' => true, 'sent_at' => now()])->save();
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('Resident push notification delivery failed after retries.', [
            'notification_id' => $this->notificationId,
            'error' => $exception?->getMessage(),
        ]);
    }
}
