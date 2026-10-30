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

class SendResidentRegistrationStatusEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public string $residentName,
        public string $residentEmail,
        public string $status,
        public ?string $rejectionReason = null,
    ) {}

    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(): void
    {
        if (! filter_var($this->residentEmail, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Resident has no valid email address for account status notification.');
        }

        $approved = $this->status === 'approved';
        $subject = $approved
            ? 'Your SeptiGuard resident account is approved'
            : 'Update on your SeptiGuard resident registration';
        $message = "Hello {$this->residentName},\n\n";
        $message .= $approved
            ? "Your SeptiGuard resident account has been approved. You can now sign in using the email address and password you registered with.\n\n"
            : "Your SeptiGuard resident registration was not approved.\n\nReason provided by the HOA:\n{$this->rejectionReason}\n\nIf you have questions, please contact the HOA administrator.\n\n";
        $message .= "Regards,\nSeptiGuard / Broadway Hagdan Loob HOA";

        Mail::raw($message, function ($mail) use ($subject): void {
            $mail->to($this->residentEmail)->subject($subject);
        });
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('Resident registration status email failed after retries.', [
            'resident_email' => $this->residentEmail,
            'status' => $this->status,
            'error' => $exception?->getMessage(),
        ]);
    }
}
