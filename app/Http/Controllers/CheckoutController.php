<?php

namespace App\Http\Controllers;

use App\Exceptions\CartConflictException;
use App\Http\Requests\StoreCheckoutRequest;
use App\Models\Book;
use App\Services\CartService;
use App\Services\OrderService;
use App\Services\Shipping\RajaOngkirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly CartService $cart) {}

    /**
     * Live ongkir quote for the chosen saved address (Phase B). Returns
     * `available: false` with a reason when shipping can't be quoted, so the
     * order can still be placed with a manually-set cost.
     */
    public function quote(Request $request, OrderService $orders, RajaOngkirService $shipping): JsonResponse
    {
        $address = $request->user()->addresses()->find((int) $request->query('address_id'));

        if ($address === null) {
            return response()->json(['available' => false, 'reason' => 'address'], 422);
        }

        if (empty($address->destination_id)) {
            return response()->json(['available' => false, 'reason' => 'no_destination']);
        }

        $books = $this->cart->availableBooks();

        if ($books->isEmpty()) {
            return response()->json(['available' => false, 'reason' => 'empty_cart'], 422);
        }

        $weight = $orders->parcelWeightGrams($books);
        $options = $shipping->calculateCost((int) $address->destination_id, $weight);

        if ($options === null) {
            return response()->json(['available' => false, 'reason' => 'unavailable', 'weight' => $weight]);
        }

        return response()->json(['available' => true, 'weight' => $weight, 'options' => $options]);
    }

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
                ->get(['id', 'label', 'recipient_name', 'recipient_phone', 'address_line', 'postal_code', 'destination_id', 'destination_label', 'is_default']),
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
