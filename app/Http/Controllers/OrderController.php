<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\Payment\MidtransService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = $request->user()->orders()
            ->withCount('items')
            ->latest()
            ->paginate(15);

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, Order $order, MidtransService $midtrans): Response
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        $order->load('items');

        return Inertia::render('orders/show', [
            'order' => $order,
            'bank' => [
                'bank' => 'BCA',
                'account_number' => '1234567890',
                'account_name' => 'Kayana Book',
            ],
            'payment' => [
                'gateway_enabled' => $midtrans->configured(),
                'client_key' => (string) config('services.midtrans.client_key'),
                'snap_url' => (string) config('services.midtrans.snap_url'),
            ],
        ]);
    }

    /**
     * Buyer confirms the shipped order has arrived, finishing it and notifying
     * the seller.
     */
    public function confirmReceived(Request $request, Order $order, OrderService $orders): RedirectResponse
    {
        abort_unless($order->user_id === $request->user()->id, 403);
        abort_unless($order->status === 'shipped', 422, 'Pesanan belum dikirim.');

        $orders->complete($order);

        return back()->with('success', 'Terima kasih, pesanan selesai.');
    }
}
