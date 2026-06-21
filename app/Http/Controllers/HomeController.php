<?php

namespace App\Http\Controllers;

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

        return Inertia::render('welcome', [
            'categories' => $categories,
        ]);
    }
}
