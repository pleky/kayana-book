<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CancelOrderRequest;
use App\Http\Requests\Admin\ShipOrderRequest;
use App\Http\Requests\Admin\UpdateOrderShippingRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $orders = Order::query()
            ->with('user:id,name')
            ->withCount('items')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('customer_name', 'ilike', "%{$search}%")
                        ->orWhereHas('items', fn ($items) => $items->where('title', 'ilike', "%{$search}%"));

                    if (ctype_digit($search)) {
                        $sub->orWhere('id', (int) $search);
                    }
                });
            })
            ->when($request->string('status')->trim()->value(), fn ($query, $status) => $query->where('status', $status))
            ->when($request->string('action')->trim()->value(), fn ($query, $action) => $this->applyActionFilter($query, $action))
            ->when($request->date('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($request->date('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->tap(fn ($query) => $this->applySort($query, $request->string('sort')->value()))
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => $request->only('search', 'status', 'sort', 'action', 'date_from', 'date_to'),
            'actionCounts' => [
                'needs_ongkir' => $this->applyActionFilter(Order::query(), 'needs_ongkir')->count(),
                'needs_ship' => $this->applyActionFilter(Order::query(), 'needs_ship')->count(),
            ],
        ]);
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    private function applyActionFilter($query, string $action)
    {
        return match ($action) {
            'needs_ongkir' => $query->where('status', 'pending')
                ->where('fulfillment', 'ship')
                ->where('shipping_cost', 0),
            'needs_ship' => $query->where('status', 'paid')
                ->where('fulfillment', 'ship'),
            default => $query,
        };
    }

    /**
     * @param  Builder<Order>  $query
     */
    private function applySort($query, ?string $sort): void
    {
        match ($sort) {
            'oldest' => $query->oldest(),
            'total_desc' => $query->orderByDesc('total'),
            'total_asc' => $query->orderBy('total'),
            default => $query->latest(),
        };
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load(['items.book:id,slug', 'events', 'user:id,name,email']),
            'events' => $order->events,
            'proofCount' => count($order->received_proof_paths ?? []),
            'maxProofs' => OrderService::MAX_PROOFS,
        ]);
    }

    public function update(UpdateOrderShippingRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();

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

    public function ship(ShipOrderRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();

        abort_unless($order->status === 'paid', 422, 'Hanya pesanan lunas yang bisa ditandai dikirim.');

        $this->orders->markShipped($order, $validated['tracking_number'] ?? null);

        return back()->with('success', 'Pesanan ditandai dikirim.');
    }

    public function complete(Order $order): RedirectResponse
    {
        abort_unless(in_array($order->status, ['paid', 'shipped'], true), 422, 'Hanya pesanan lunas atau dikirim yang bisa diselesaikan.');

        $this->orders->complete($order);

        return back()->with('success', 'Pesanan diselesaikan.');
    }

    public function cancel(CancelOrderRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();

        abort_if(in_array($order->status, ['completed', 'cancelled'], true), 422, 'Pesanan ini tidak bisa dibatalkan.');

        $this->orders->cancel($order, $validated['cancel_reason'] ?? 'dibatalkan pemilik');

        return back()->with('success', 'Pesanan dibatalkan.');
    }
}
