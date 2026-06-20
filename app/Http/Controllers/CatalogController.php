<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
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
            ->when($request->string('search')->trim()->value(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'ilike', "%{$search}%")
                        ->orWhere('author', 'ilike', "%{$search}%");
                });
            })
            ->when($request->string('category')->trim()->value(), function ($query, string $slug): void {
                $query->whereHas('category', fn ($query) => $query->where('slug', $slug));
            })
            ->when($request->string('language')->trim()->value(), fn ($query, string $value) => $query->where('language', $value))
            ->when($request->string('audience')->trim()->value(), fn ($query, string $value) => $query->where('audience', $value))
            ->when($request->string('condition')->trim()->value(), fn ($query, string $value) => $query->where('condition', $value))
            ->when($request->integer('min_price'), fn ($query, int $value) => $query->where('price', '>=', $value))
            ->when($request->integer('max_price'), fn ($query, int $value) => $query->where('price', '<=', $value))
            ->latest()
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('catalog/index', [
            'books' => $books,
            'categories' => Category::orderBy('sort_order')->get(['id', 'name', 'slug']),
            'filters' => $request->only(
                'search', 'category', 'language', 'audience', 'condition', 'min_price', 'max_price',
            ),
        ]);
    }

    public function show(Book $book): Response
    {
        abort_unless($book->status === 'available', 404);

        return Inertia::render('catalog/show', [
            'book' => $book->load(['images', 'category']),
        ]);
    }
}
