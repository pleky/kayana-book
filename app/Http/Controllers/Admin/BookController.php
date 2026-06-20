<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBookRequest;
use App\Http\Requests\Admin\UpdateBookRequest;
use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(Request $request): Response
    {
        $books = Book::query()
            ->with('primaryImage')
            ->when($request->string('search')->trim()->value(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'ilike', "%{$search}%")
                        ->orWhere('author', 'ilike', "%{$search}%");
                });
            })
            ->when($request->string('status')->trim()->value(), function ($query, string $status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/books/index', [
            'books' => $books,
            'filters' => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/books/create', [
            'categories' => Category::orderBy('sort_order')->get(['id', 'name']),
        ]);
    }

    public function store(StoreBookRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $book = DB::transaction(function () use ($data, $request): Book {
            $book = Book::create([
                ...collect($data)->except('photos')->all(),
                'slug' => $this->uniqueSlug($data['title']),
            ]);

            $this->storePhotos($book, $request->file('photos', []));

            return $book;
        });

        return to_route('admin.books.edit', $book)
            ->with('success', "Buku \"{$book->title}\" tersimpan.");
    }

    public function edit(Book $book): Response
    {
        return Inertia::render('admin/books/edit', [
            'book' => $book->load('images'),
            'categories' => Category::orderBy('sort_order')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateBookRequest $request, Book $book): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($book, $data, $request): void {
            if ($data['status'] === 'sold' && $book->sold_at === null) {
                $data['sold_at'] = now();
            } elseif ($data['status'] !== 'sold') {
                $data['sold_at'] = null;
            }

            $book->update(collect($data)->except('photos')->all());

            $this->storePhotos($book, $request->file('photos', []));
        });

        return back()->with('success', 'Buku diperbarui.');
    }

    public function destroy(Book $book): RedirectResponse
    {
        $book->delete();

        return to_route('admin.books.index')->with('success', 'Buku dihapus.');
    }

    /**
     * Persist uploaded photos as book_images rows. Marks the first photo as
     * primary when the book has none yet.
     *
     * @param  array<int, UploadedFile>  $photos
     */
    private function storePhotos(Book $book, array $photos): void
    {
        if ($photos === []) {
            return;
        }

        $hasPrimary = $book->images()->where('is_primary', true)->exists();
        $sortOrder = (int) $book->images()->max('sort_order');

        foreach ($photos as $photo) {
            $book->images()->create([
                'path' => $photo->store('books', 'public'),
                'is_primary' => ! $hasPrimary,
                'sort_order' => ++$sortOrder,
            ]);

            $hasPrimary = true;
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'buku';
        $slug = $base;
        $suffix = 1;

        while (Book::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-".++$suffix;
        }

        return $slug;
    }
}
