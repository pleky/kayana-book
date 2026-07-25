<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->withCount(['books' => fn ($query) => $query->where('status', 'available')])
            ->orderByDesc('books_count')
            ->limit(5)
            ->get(['id', 'name', 'slug', 'parent_id'])
            ->filter(fn (Category $category): bool => $category->books_count > 0)
            ->values();

        $latestBooks = Book::query()
            ->listed()
            ->with('primaryImage')
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'slug', 'author', 'price', 'condition', 'created_at']);

        return Inertia::render('welcome', [
            'categories' => $categories,
            'latestBooks' => $latestBooks,
            'store' => config('store'),
        ]);
    }
}
