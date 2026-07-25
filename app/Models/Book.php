<?php

namespace App\Models;

use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'is_unlisted',
        'category_id',
        'language',
        'audience',
        'weight_grams',
        'sold_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_new' => 'boolean',
            'is_unlisted' => 'boolean',
            'price' => 'integer',
            'cost_price' => 'integer',
            'weight_grams' => 'integer',
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
     * @return BelongsToMany<Tag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * @return HasMany<BookImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(BookImage::class)->orderBy('sort_order');
    }

    /**
     * @return HasOne<BookImage, $this>
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(BookImage::class)->where('is_primary', true);
    }

    /**
     * @param  Builder<Book>  $query
     */
    public function scopeAvailable(Builder $query): void
    {
        $query->where('status', 'available');
    }

    /**
     * Publicly browsable: available stock and not hidden behind a checkout link.
     *
     * @param  Builder<Book>  $query
     */
    public function scopeListed(Builder $query): void
    {
        $query->where('status', 'available')->where('is_unlisted', false);
    }

    /**
     * Full-text search across title, author, description and ISBN using the
     * generated `searchable` tsvector. Each word is matched as a prefix so
     * partial typing still returns results.
     *
     * @param  Builder<Book>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $tsquery = collect(preg_split('/\s+/', trim($term)) ?: [])
            ->map(fn (string $word): string => preg_replace('/[^\p{L}\p{N}]/u', '', $word) ?? '')
            ->filter()
            ->map(fn (string $word): string => $word.':*')
            ->implode(' & ');

        if ($tsquery === '') {
            return;
        }

        $query->whereRaw("searchable @@ to_tsquery('simple', ?)", [$tsquery]);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
