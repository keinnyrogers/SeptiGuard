<?php

namespace App\Jobs;

use App\Models\SeptiNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class DeliverResidentNotification implements ShouldQueue
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
            $resident->role !== 'resident'
            || $resident->account_status !== 'approved'
            || $resident->demo_mode
        ) {
            Log::info('Queued resident notification cancelled because the account is no longer eligible.', [
                'notification_id' => $notification->id,
                'user_id' => $resident->id,
            ]);
            $notification->delete();

            return;
        }

        if ($notification->channel === 'email') {
            $this->sendEmail($notification, (string) $resident->email);
        } elseif ($notification->channel === 'sms') {
            Log::warning('Legacy SMS notification discarded because SMS delivery is disabled.', [
                'notification_id' => $notification->id,
            ]);
            $notification->delete();

            return;
        } else {
            throw new RuntimeException("Unsupported notification channel [{$notification->channel}].");
        }

        $notification->forceFill([
            'is_sent' => true,
            'sent_at' => now(),
        ])->save();
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('Resident notification delivery failed after retries.', [
            'notification_id' => $this->notificationId,
            'error' => $exception?->getMessage(),
        ]);
    }

    private function sendEmail(SeptiNotification $notification, string $email): void
    {
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Resident has no valid email address for notification delivery.');
        }

        Mail::raw($notification->message, function ($mail) use ($notification, $email): void {
            $mail->to($email)->subject($notification->title);
        });
    }
}
