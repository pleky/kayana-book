<?php

namespace App\Http\Controllers;

use App\Exceptions\CartConflictException;
use App\Models\CheckoutLink;
use App\Services\OrderService;
use App\Services\Payment\MidtransService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutLinkController extends Controller
{
    /**
     * Public, token-gated product page. Only reachable with a valid (active,
     * unexpired, unconsumed) link — anything else 404s, no enumeration leak.
     */
    public function show(CheckoutLink $checkoutLink, MidtransService $midtrans): Response
    {
        abort_unless($checkoutLink->isOpen(), 404);

        $checkoutLink->load(['books:id,title,price', 'books.primaryImage']);

        $subtotal = (int) $checkoutLink->books->sum('price');
        $shippingCost = $checkoutLink->shipping_mode === 'admin_set'
            ? (int) $checkoutLink->shipping_cost
            : 0;

        return Inertia::render('checkout-link/show', [
            'link' => [
                'token' => $checkoutLink->token,
                'label' => $checkoutLink->label,
                'shipping_mode' => $checkoutLink->shipping_mode,
                'shipping_cost' => $shippingCost,
                'subtotal' => $subtotal,
                'total' => $subtotal + $shippingCost,
                'recipient_name' => $checkoutLink->recipient_name,
                'shipping_address' => $checkoutLink->shipping_address,
                'books' => $checkoutLink->books->map(fn ($book): array => [
                    'id' => $book->id,
                    'title' => $book->title,
                    'price' => $book->price,
                    'cover_path' => $book->primaryImage?->path,
                ]),
            ],
            'gateway_enabled' => $midtrans->configured(),
        ]);
    }

    /**
     * Guest checkout: build the order from the link and send the buyer to the
     * token-based tracking page (where they can pay).
     */
    public function store(Request $request, CheckoutLink $checkoutLink, OrderService $orders): RedirectResponse
    {
        abort_unless($checkoutLink->isOpen(), 404);

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
        ]);

        try {
            $order = $orders->createFromLink($checkoutLink, $validated);
        } catch (CartConflictException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('guest.orders.show', $order->track_token);
    }
}
