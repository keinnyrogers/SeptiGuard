<?php

namespace App\Services;

use App\Events\TankReadingReceived;
use App\Models\SepticSystem;
use App\Models\TankReading;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SensorReadingService
{
    public function __construct(private ResidentNotificationService $notifications) {}

    /**
     * @param  array{device_id: string, fill_level_percentage?: int|float, distance_cm?: int|float|null, wifi_rssi_dbm?: int|null, measured_at?: string, notes?: string|null, firmware_version?: string}  $payload
     */
    public function store(array $payload, string $source = 'sensor'): TankReading
    {
        $septicSystem = SepticSystem::query()
            ->with('user')
            ->where('device_id', $payload['device_id'])
            ->firstOrFail();
        $previousReading = $septicSystem->tankReadings()
            ->orderByDesc('measured_at')
            ->orderByDesc('id')
            ->first();

        $fillLevel = $this->calculateFillLevel($septicSystem, $payload);
        $status = match (true) {
            $fillLevel >= 80 => 'critical',
            $fillLevel >= 70 => 'warning',
            default => 'normal',
        };

        $reading = DB::transaction(function () use (
            $septicSystem,
            $payload,
            $fillLevel,
            $status,
            $source,
            $previousReading,
        ): TankReading {
            if (
                isset($payload['firmware_version']) &&
                $septicSystem->firmware_version !== $payload['firmware_version']
            ) {
                $septicSystem->firmware_version = $payload['firmware_version'];
                $septicSystem->save();
            }

            $reading = $septicSystem->tankReadings()->create([
                'fill_level_percentage' => $fillLevel,
                'distance_cm' => $payload['distance_cm'] ?? null,
                'wifi_rssi_dbm' => $payload['wifi_rssi_dbm'] ?? null,
                'measured_at' => isset($payload['measured_at'])
                    ? Carbon::parse($payload['measured_at'])
                    : now(),
                'source' => $source,
                'notes' => $payload['notes'] ?? null,
                'status' => $status,
            ]);

            $isLatestReading = $previousReading === null
                || $reading->measured_at->greaterThanOrEqualTo($previousReading->measured_at);
            if ($isLatestReading && $source !== 'simulated') {
                $this->notifications->tankThresholdCrossed(
                    $septicSystem->user,
                    $septicSystem,
                    $reading,
                    $previousReading?->status,
                );
            }

            return $reading;
        });

        TankReadingReceived::dispatch($reading, $septicSystem->device_id);

        return $reading;
    }

    /**
     * @param  array{fill_level_percentage?: int|float, distance_cm?: int|float|null}  $payload
     */
    private function calculateFillLevel(SepticSystem $septicSystem, array $payload): float
    {
        if ($septicSystem->tank_height_cm !== null && isset($payload['distance_cm'])) {
            $fillLevel = (($septicSystem->tank_height_cm - $payload['distance_cm']) / $septicSystem->tank_height_cm) * 100;
        } else {
            $fillLevel = (float) ($payload['fill_level_percentage'] ?? 0);
        }

        return round(max(0, min(100, $fillLevel)), 2);
    }
}
