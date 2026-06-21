<?php

namespace App\Http\Controllers;

use App\Exceptions\CartConflictException;
use App\Http\Requests\StoreCheckoutRequest;
use App\Models\Book;
use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly CartService $cart) {}

    public function create(Request $request): Response|RedirectResponse
    {
        $books = $this->cart->availableBooks();

        if ($books->isEmpty()) {
            return to_route('cart.index')->with('error', 'Keranjang kosong.');
        }

        return Inertia::render('checkout/create', [
            'items' => $books->map(fn (Book $book): array => [
                'id' => $book->id,
                'title' => $book->title,
                'price' => $book->price,
            ])->values(),
            'subtotal' => (int) $books->sum('price'),
            'addresses' => $request->user()->addresses()
                ->orderByDesc('is_default')
                ->latest()
                ->get(['id', 'label', 'recipient_name', 'recipient_phone', 'address_line', 'postal_code', 'is_default']),
        ]);
    }

    public function store(StoreCheckoutRequest $request, OrderService $orders): RedirectResponse
    {
        try {
            $order = $orders->createFromCart($request->user(), $request->validated());
        } catch (CartConflictException $e) {
            return to_route('cart.index')->with('error', $e->getMessage());
        }

        return to_route('orders.show', $order)
            ->with('success', 'Pesanan dibuat. Silakan transfer untuk menyelesaikan.');
    }
}
