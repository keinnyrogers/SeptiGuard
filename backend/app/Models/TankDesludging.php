<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TankDesludging extends Model
{
    protected $fillable = [
        'septic_system_id',
        'performed_on',
        'recorded_by',
    ];

    /**
     * @return BelongsTo<SepticSystem, TankDesludging>
     */
    public function septicSystem(): BelongsTo
    {
        return $this->belongsTo(SepticSystem::class);
    }

    /**
     * @return BelongsTo<User, TankDesludging>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    protected function casts(): array
    {
        return ['performed_on' => 'date'];
    }
}
