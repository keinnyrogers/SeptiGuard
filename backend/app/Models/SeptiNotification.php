<?php

namespace App\Models;

use Database\Factories\SeptiNotificationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeptiNotification extends Model
{
    /** @use HasFactory<SeptiNotificationFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'channel',
        'is_read',
        'is_sent',
        'sent_at',
    ];

    /**
     * @return BelongsTo<User, SeptiNotification>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'is_sent' => 'boolean',
            'sent_at' => 'datetime',
        ];
    }
}
