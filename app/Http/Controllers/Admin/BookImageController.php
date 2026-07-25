<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class BookImageController extends Controller
{
    public function destroy(Book $book, BookImage $image): RedirectResponse
    {
        abort_unless($image->book_id === $book->id, 404);

        Storage::disk('public')->delete($image->path);
        $wasPrimary = $image->is_primary;
        $image->delete();

        // Keep a primary photo whenever any remain.
        if ($wasPrimary) {
            $next = $book->images()->orderBy('sort_order')->first();
            $next?->update(['is_primary' => true]);
        }

        return back()->with('success', 'Foto dihapus.');
    }

    public function setPrimary(Book $book, BookImage $image): RedirectResponse
    {
        abort_unless($image->book_id === $book->id, 404);

        $book->images()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return back()->with('success', 'Foto utama diperbarui.');
    }
}
