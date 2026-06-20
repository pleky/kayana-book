<?php

namespace App\Models;

use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    /** @use HasFactory<BookFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'author',
        'isbn',
        'description',
        'condition',
        'is_new',
        'price',
        'cost_price',
        'status',
        'category_id',
        'language',
        'audience',
        'sold_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_new' => 'boolean',
            'price' => 'integer',
            'cost_price' => 'integer',
            'sold_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<BookImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(BookImage::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<BookImage, $this>
     */
    public function primaryImage(): HasMany
    {
        return $this->images()->where('is_primary', true);
    }

    /**
     * @param  Builder<Book>  $query
     */
    public function scopeAvailable(Builder $query): void
    {
        $query->where('status', 'available');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
