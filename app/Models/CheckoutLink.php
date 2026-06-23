<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CheckoutLink extends Model
{
    protected $fillable = [
        'label',
        'token',
        'status',
        'shipping_mode',
        'shipping_cost',
        'weight_grams',
        'recipient_name',
        'recipient_phone',
        'shipping_address',
        'expires_at',
        'order_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'shipping_cost' => 'integer',
            'weight_grams' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<Book, $this>
     */
    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'checkout_link_book');
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Whether a guest may still check out via this link: active, not expired, and
     * not already consumed by a live (non-cancelled) order.
     */
    public function isOpen(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->order_id !== null) {
            return $this->order?->status === 'cancelled';
        }

        return true;
    }

    public function getRouteKeyName(): string
    {
        return 'token';
    }
}
