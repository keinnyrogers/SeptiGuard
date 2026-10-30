<?php

namespace App\Support;

class ResidentEmailConfiguration
{
    public static function isConfigured(): bool
    {
        return config('mail.default') === 'smtp'
            && (string) config('mail.mailers.smtp.host') !== ''
            && (string) config('mail.mailers.smtp.username') !== ''
            && (string) config('mail.mailers.smtp.password') !== ''
            && filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL) !== false;
    }
}
