<?php

namespace App\Services;

use App\Jobs\DeliverResidentNotification;
use App\Models\Complaint;
use App\Models\SepticSystem;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ResidentNotificationService
{
    public function complaintUpdated(Complaint $complaint, bool $statusChanged, bool $responseChanged): void
    {
        $resident = $complaint->user;
        if (! $this->canNotify($resident) || (! $statusChanged && ! $responseChanged)) {
            return;
        }

        $statusLabel = match ($complaint->status) {
            'in_progress' => 'In progress',
            'completed' => 'Resolved',
            default => 'Pending',
        };
        $isDesludgingRequest = str_starts_with(
            $complaint->title,
            'Maintenance request: Desludging service for ',
        );
        $message = match (true) {
            $statusChanged && $isDesludgingRequest => "The HOA updated your desludging service status to {$statusLabel}.",
            $statusChanged => "The HOA updated your complaint status to {$statusLabel}.",
            (bool) $complaint->hoa_response => 'The HOA responded to your complaint.',
            default => 'The HOA updated its response to your complaint.',
        };
        if ($complaint->hoa_response) {
            $message .= ' '.$complaint->hoa_response;
        }

        $title = $isDesludgingRequest
            ? 'Desludging service '.$statusLabel
            : 'Complaint '.$complaint->ticket_code.' updated';
        $this->create($resident, 'ticket_update', $title, $message);
    }

    public function maintenanceScheduled(Complaint $complaint): void
    {
        $resident = $complaint->user;
        if (! $this->canNotify($resident)) {
            return;
        }

        $dateLabel = $complaint->scheduled_for?->toFormattedDateString() ?? 'the planned date';
        $this->create(
            $resident,
            'ticket_update',
            'Desludging scheduled for '.$dateLabel,
            "The HOA scheduled desludging for {$dateLabel}. You can follow progress in Maintenance.",
        );
    }

    public function tankThresholdCrossed(
        ?User $resident,
        SepticSystem $septicSystem,
        TankReading $reading,
        ?string $previousStatus,
    ): void {
        if (! $this->canNotify($resident)) {
            return;
        }

        $rank = ['normal' => 0, 'warning' => 1, 'critical' => 2];
        $currentRank = $rank[$reading->status] ?? 0;
        $previousRank = $rank[$previousStatus] ?? 0;
        if ($currentRank <= $previousRank || $reading->status === 'normal') {
            return;
        }

        $critical = $reading->status === 'critical';
        $level = (float) $reading->fill_level_percentage;
        $this->create(
            $resident,
            $critical ? 'critical_alert' : 'warning_alert',
            $critical
                ? $septicSystem->device_id.' reached critical level'
                : $septicSystem->device_id.' reached warning level',
            sprintf(
                'Your tank is at %.2f%% capacity. %s',
                $level,
                $critical
                    ? 'Schedule a pump-out service soon.'
                    : 'Consider planning maintenance.',
            ),
        );
    }

    private function canNotify(?User $resident): bool
    {
        return $resident !== null
            && $resident->role === 'resident'
            && $resident->account_status === 'approved'
            && ! $resident->demo_mode;
    }

    private function create(User $resident, string $type, string $title, string $message): void
    {
        $resident->septiNotifications()->create([
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'channel' => 'in_app',
            'is_read' => false,
            'is_sent' => true,
            'sent_at' => now(),
        ]);

        if (! $this->emailConfigured()) {
            Log::warning('Resident email notification channel is not configured; delivery skipped.', [
                'user_id' => $resident->id,
                'notification_type' => $type,
                'channel' => 'email',
            ]);

            return;
        }

        $delivery = $resident->septiNotifications()->create([
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'channel' => 'email',
            'is_read' => true,
            'is_sent' => false,
        ]);

        DeliverResidentNotification::dispatch($delivery->id)->afterCommit();
    }

    private function emailConfigured(): bool
    {
        return config('mail.default') === 'smtp'
            && (string) config('mail.mailers.smtp.host') !== ''
            && (string) config('mail.mailers.smtp.username') !== ''
            && (string) config('mail.mailers.smtp.password') !== ''
            && filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL) !== false;
    }
}
