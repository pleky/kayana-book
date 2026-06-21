<?php

namespace App\Models;

use Database\Factories\UserAddressFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAddress extends Model
{
    /** @use HasFactory<UserAddressFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'recipient_name',
        'recipient_phone',
        'address_line',
        'postal_code',
        'destination_id',
        'destination_label',
        'is_default',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'destination_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
