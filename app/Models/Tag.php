<?php

namespace App\Models;

use Database\Factories\TagFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class Tag extends Model
{
    /** @use HasFactory<TagFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * Resolve a list of free-text tag names to persisted Tag models, creating
     * any that do not yet exist. Names are matched case-insensitively by slug.
     *
     * @param  array<int, string>  $names
     * @return Collection<int, Tag>
     */
    public static function fromNames(array $names): Collection
    {
        return collect($names)
            ->map(fn (string $name): string => trim($name))
            ->filter()
            ->unique(fn (string $name): string => Str::slug($name))
            ->map(fn (string $name): Tag => static::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            ))
            ->values();
    }

    /**
     * @return BelongsToMany<Book, $this>
     */
    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
