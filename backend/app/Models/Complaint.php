<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $fillable = [
        'user_id',
        'ticket_code',
        'title',
        'category',
        'description',
        'location',
        'photo_path',
        'status',
        'hoa_response',
        'assigned_to',
        'resolved_at',
        'scheduled_for',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'scheduled_for' => 'date',
    ];

    // Auto generate ticket code
    public static function generateTicketCode(): string
    {
        $latest = self::latest()->first();
        $number = $latest ?
            (int) substr($latest->ticket_code, 4) + 1 : 1;

        return 'CMP-'.str_pad($number, 3, '0', STR_PAD_LEFT);
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
