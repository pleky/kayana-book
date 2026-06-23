<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\Payment\MidtransService;
use Inertia\Inertia;
use Inertia\Response;

class GuestOrderController extends Controller
{
    /**
     * Read-only guest order tracking, keyed by the order's `track_token` (a
     * separate secret from the checkout link token). Shows status, items, resi,
     * and history; lets the buyer pay while still pending.
     */
    public function show(Order $order, MidtransService $midtrans): Response
    {
        abort_unless($order->channel === 'link', 404);

        $order->load(['items', 'events']);

        return Inertia::render('orders/track', [
            'order' => $order,
            'events' => $order->events,
            'payment' => [
                'gateway_enabled' => $midtrans->configured(),
                'client_key' => (string) config('services.midtrans.client_key'),
                'snap_url' => (string) config('services.midtrans.snap_url'),
            ],
        ]);
    }
}
