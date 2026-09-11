<?php

namespace App\Models;

use Database\Factories\TankReadingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TankReading extends Model
{
    /** @use HasFactory<TankReadingFactory> */
    use HasFactory;

    protected $fillable = [
        'septic_system_id',
        'fill_level_percentage',
        'measured_at',
        'source',
        'notes',
        'status',
        'distance_cm',
    ];

    /**
     * @return BelongsTo<SepticSystem, TankReading>
     */
    public function septicSystem(): BelongsTo
    {
        return $this->belongsTo(SepticSystem::class);
    }

    protected function casts(): array
    {
        return [
            'measured_at' => 'datetime',
            'distance_cm' => 'decimal:2',
        ];
    }
}
