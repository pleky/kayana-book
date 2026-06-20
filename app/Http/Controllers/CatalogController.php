<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $books = Book::query()
            ->available()
            ->with('primaryImage')
            ->when($request->string('search')->trim()->value(), fn (Builder $query, string $search) => $query->search($search))
            ->when($request->string('category')->trim()->value(), function (Builder $query, string $slug): void {
                $this->filterByCategory($query, $slug);
            })
            ->when($request->string('tag')->trim()->value(), fn (Builder $query, string $slug) => $query->whereHas('tags', fn (Builder $tags) => $tags->where('slug', $slug)))
            ->when($request->string('language')->trim()->value(), fn (Builder $query, string $value) => $query->where('language', $value))
            ->when($request->string('audience')->trim()->value(), fn (Builder $query, string $value) => $query->where('audience', $value))
            ->when($request->string('condition')->trim()->value(), fn (Builder $query, string $value) => $query->where('condition', $value))
            ->when($request->integer('min_price'), fn (Builder $query, int $value) => $query->where('price', '>=', $value))
            ->when($request->integer('max_price'), fn (Builder $query, int $value) => $query->where('price', '<=', $value))
            ->tap(fn (Builder $query) => $this->applySort($query, $request->string('sort')->value()))
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('catalog/index', [
            'books' => $books,
            'categories' => Category::orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'parent_id']),
            'tags' => Tag::orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => $request->only(
                'search', 'category', 'tag', 'language', 'audience', 'condition', 'min_price', 'max_price', 'sort',
            ),
        ]);
    }

    public function show(Book $book): Response
    {
        abort_unless($book->status === 'available', 404);

        return Inertia::render('catalog/show', [
            'book' => $book->load(['images', 'category', 'tags']),
        ]);
    }

    /**
     * Filter by a category slug. When the slug points at a root category, its
     * sub-categories are included too.
     *
     * @param  Builder<Book>  $query
     */
    private function filterByCategory(Builder $query, string $slug): void
    {
        $category = Category::where('slug', $slug)->first();

        if ($category === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        $ids = [$category->id, ...$category->children()->pluck('id')->all()];

        $query->whereIn('category_id', $ids);
    }

    /**
     * @param  Builder<Book>  $query
     */
    private function applySort(Builder $query, ?string $sort): void
    {
        match ($sort) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            default => $query->latest(),
        };
    }
}
