<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Hidden(['token_hash'])]
class UserApiToken extends Model
{
    protected $fillable = [
        'user_id',
        'token_hash',
    ];

    /**
     * @return BelongsTo<User, UserApiToken>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
