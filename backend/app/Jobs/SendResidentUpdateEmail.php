<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class SendResidentUpdateEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public string $residentEmail,
        public string $subject,
        public string $message,
    ) {}

    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(): void
    {
        if (! filter_var($this->residentEmail, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Resident has no valid email address for update notification.');
        }

        Mail::raw($this->message, function ($mail): void {
            $mail->to($this->residentEmail)->subject($this->subject);
        });
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('Resident update email failed after retries.', [
            'resident_email' => $this->residentEmail,
            'subject' => $this->subject,
            'error' => $exception?->getMessage(),
        ]);
    }
}
