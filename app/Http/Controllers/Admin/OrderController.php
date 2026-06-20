<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->with('user:id,name')
            ->withCount('items')
            ->when($request->string('status')->trim()->value(), function ($query, string $status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load(['items', 'user:id,name,email']),
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'shipping_cost' => ['required', 'integer', 'min:0'],
        ]);

        abort_unless($order->status === 'pending', 422, 'Ongkir hanya bisa diubah saat pesanan masih pending.');

        $this->orders->setShipping($order, $validated['shipping_cost']);

        return back()->with('success', 'Ongkir diperbarui.');
    }

    public function pay(Order $order): RedirectResponse
    {
        abort_unless($order->status === 'pending', 422, 'Hanya pesanan pending yang bisa ditandai lunas.');

        $this->orders->markPaid($order);

        return back()->with('success', 'Pesanan ditandai lunas.');
    }

    public function complete(Order $order): RedirectResponse
    {
        abort_unless($order->status === 'paid', 422, 'Hanya pesanan lunas yang bisa diselesaikan.');

        $this->orders->complete($order);

        return back()->with('success', 'Pesanan diselesaikan.');
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'cancel_reason' => ['nullable', 'string', 'max:255'],
        ]);

        abort_if(in_array($order->status, ['completed', 'cancelled'], true), 422, 'Pesanan ini tidak bisa dibatalkan.');

        $this->orders->cancel($order, $validated['cancel_reason'] ?? 'dibatalkan pemilik');

        return back()->with('success', 'Pesanan dibatalkan.');
    }
}
