<?php

namespace App\Models;

use App\Enums\OrderEventType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<string, mixed>|null $meta
 */
class OrderEvent extends Model
{
    /** Audit rows are append-only — only a created_at timestamp. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'type',
        'description',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => OrderEventType::class,
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
