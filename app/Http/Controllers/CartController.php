<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cart) {}

    public function index(): Response
    {
        $books = $this->cart->availableBooks();

        return Inertia::render('cart/index', [
            'items' => $books->map(fn (Book $book): array => [
                'id' => $book->id,
                'slug' => $book->slug,
                'title' => $book->title,
                'author' => $book->author,
                'price' => $book->price,
                'condition' => $book->condition,
                'cover' => $book->primaryImage->first()?->path,
            ])->values(),
            'subtotal' => (int) $books->sum('price'),
        ]);
    }

    public function store(Book $book): RedirectResponse
    {
        if ($book->status !== 'available') {
            return back()->with('error', 'Buku ini sudah tidak tersedia.');
        }

        $this->cart->add($book);

        return back()->with('success', 'Ditambahkan ke keranjang.');
    }

    public function destroy(Book $book): RedirectResponse
    {
        $this->cart->remove($book);

        return back()->with('success', 'Dihapus dari keranjang.');
    }
}
