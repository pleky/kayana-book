<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'channel',
        'subtotal',
        'shipping_cost',
        'total',
        'customer_name',
        'customer_phone',
        'recipient_name',
        'recipient_phone',
        'fulfillment',
        'shipping_address',
        'shipping_postal_code',
        'shipping_destination_id',
        'shipping_destination_label',
        'shipping_courier',
        'shipping_service',
        'shipping_etd',
        'shipping_weight_grams',
        'shipping_tracking_number',
        'shipped_at',
        'payment_method',
        'payment_gateway',
        'payment_reference',
        'payment_channel',
        'snap_token',
        'expires_at',
        'cancel_reason',
        'paid_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'shipping_cost' => 'integer',
            'total' => 'integer',
            'shipping_destination_id' => 'integer',
            'shipping_weight_grams' => 'integer',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
            'shipped_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
