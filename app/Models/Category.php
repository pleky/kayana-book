<?php

namespace App\Models;

use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory;

    /**
     * Cache key for the shared catalog navigation tree.
     */
    public const NAV_CACHE_KEY = 'nav_categories';

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'sort_order',
    ];

    /**
     * Bust the cached navigation whenever any category changes.
     */
    protected static function booted(): void
    {
        $forget = fn () => Cache::forget(self::NAV_CACHE_KEY);

        static::saved($forget);
        static::deleted($forget);
    }

    /**
     * @return HasMany<Book, $this>
     */
    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
