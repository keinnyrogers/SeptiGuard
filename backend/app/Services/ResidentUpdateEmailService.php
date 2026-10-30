<?php

namespace App\Services;

use App\Jobs\SendResidentUpdateEmail;
use App\Models\ResidentInformationChangeRequest;
use App\Models\SepticSystem;
use App\Models\User;
use App\Support\ResidentEmailConfiguration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ResidentUpdateEmailService
{
    public function queueInformationChangeDecision(
        User $resident,
        string $recipientEmail,
        ResidentInformationChangeRequest $changeRequest,
        string $status,
    ): bool {
        if (! $this->canEmail($resident, $recipientEmail, 'information_change_'.$status)) {
            return false;
        }

        $field = match ($changeRequest->field) {
            'name' => 'name',
            'email' => 'email address',
            'phone' => 'phone number',
            'address' => 'address',
            'household' => 'household size',
            'other' => 'request',
            default => 'information',
        };
        $approved = $status === 'approved';
        $message = "Hello {$resident->name},\n\n";
        $message .= match (true) {
            $approved && $changeRequest->field === 'other' => "Your request was reviewed and marked resolved by the HOA.\n\n",
            $approved => "Your request to update your {$field} was approved by the HOA. The approved change has been applied to your account.\n\n",
            default => "Your request to update your {$field} was declined by the HOA. Please contact the HOA administrator if you have questions.\n\n",
        };
        $message .= "Regards,\nSeptiGuard / Broadway Hagdan Loob HOA";

        SendResidentUpdateEmail::dispatch(
            $recipientEmail,
            $approved ? 'Your SeptiGuard information change was approved' : 'Update on your SeptiGuard information change',
            $message,
        )->afterCommit();

        return true;
    }

    public function queueCompletedDesludging(SepticSystem $system, string $performedOn): bool
    {
        $system->loadMissing('user');
        $resident = $system->user;
        if ($resident === null || ! $this->canEmail($resident, (string) $resident->email, 'desludging_completed')) {
            return false;
        }

        $date = Carbon::parse($performedOn)->toFormattedDateString();
        $message = "Hello {$resident->name},\n\n";
        $message .= "The HOA recorded completed desludging for tank {$system->device_id} on {$date}. ";
        $message .= 'Forecasting will use readings recorded after this service date, with a provisional estimate based on the previous fill rate until enough new readings are collected. ';
        $message .= "If this information is incorrect, please contact the HOA administrator.\n\n";
        $message .= "Regards,\nSeptiGuard / Broadway Hagdan Loob HOA";

        SendResidentUpdateEmail::dispatch(
            (string) $resident->email,
            'Your SeptiGuard tank desludging was recorded',
            $message,
        )->afterCommit();

        return true;
    }

    private function canEmail(User $resident, string $recipientEmail, string $event): bool
    {
        if (
            $resident->role !== 'resident'
            || $resident->account_status !== 'approved'
            || $resident->demo_mode
            || ! filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)
        ) {
            Log::info('Resident update email skipped because the resident is not eligible.', [
                'user_id' => $resident->id,
                'event' => $event,
            ]);

            return false;
        }

        if (! ResidentEmailConfiguration::isConfigured()) {
            Log::warning('Resident update email skipped because SMTP is not configured.', [
                'user_id' => $resident->id,
                'event' => $event,
            ]);

            return false;
        }

        return true;
    }
}
