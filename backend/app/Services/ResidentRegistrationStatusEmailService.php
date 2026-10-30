<?php

namespace App\Services;

use App\Jobs\SendResidentRegistrationStatusEmail;
use App\Models\User;
use App\Support\ResidentEmailConfiguration;
use Illuminate\Support\Facades\Log;

class ResidentRegistrationStatusEmailService
{
    public function queueStatusEmail(User $resident, string $status, ?string $rejectionReason): bool
    {
        if (! ResidentEmailConfiguration::isConfigured()) {
            Log::warning('Resident registration status email skipped because SMTP is not configured.', [
                'user_id' => $resident->id,
                'status' => $status,
            ]);

            return false;
        }

        SendResidentRegistrationStatusEmail::dispatch(
            $resident->name,
            $resident->email,
            $status,
            $rejectionReason,
        )->afterCommit();

        return true;
    }
}
