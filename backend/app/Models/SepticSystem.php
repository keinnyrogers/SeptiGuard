<?php

namespace App\Models;

use Database\Factories\SepticSystemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'device_id', 'tank_type', 'capacity_liters', 'installation_date', 'last_maintenance_date', 'location'])]
class SepticSystem extends Model
{
    /** @use HasFactory<SepticSystemFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, SepticSystem>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<TankReading, SepticSystem>
     */
    public function tankReadings(): HasMany
    {
        return $this->hasMany(TankReading::class);
    }

    protected function casts(): array
    {
        return [
            'installation_date' => 'date',
            'last_maintenance_date' => 'date',
        ];
    }
}
