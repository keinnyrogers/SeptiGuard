<?php

namespace App\Events;

use App\Models\TankReading;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TankReadingReceived implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public TankReading $reading,
        public string $deviceId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('tank.'.$this->deviceId)];
    }

    public function broadcastAs(): string
    {
        return 'reading.received';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'fill_level_percentage' => (float) $this->reading->fill_level_percentage,
            'distance_cm' => $this->reading->distance_cm !== null ? (float) $this->reading->distance_cm : null,
            'status' => $this->reading->status,
            'measured_at' => $this->reading->measured_at?->toISOString(),
        ];
    }
}
