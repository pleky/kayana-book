<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\Payment\MidtransService;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request, OrderService $orders): Response
    {
        $search = $request->string('search')->trim()->value();

        $list = $request->user()->orders()
            ->withCount('items')
            ->with([
                'items:id,order_id,book_id,title,price,cover_path',
                'items.book:id,title,price',
                'items.book.primaryImage',
            ])
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
            ->when($request->date('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($request->date('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->tap(fn ($query) => $this->applySort($query, $request->string('sort')->value()))
            ->paginate(15)
            ->withQueryString();

        // Flag pending orders whose book details drifted from the snapshot, then
        // drop the heavy book relation so the payload stays lean.
        $list->getCollection()->transform(function (Order $order) use ($orders): Order {
            $order->setAttribute('has_updates', $orders->pendingHasBookChanges($order));
            $order->items->each->unsetRelation('book');

            return $order;
        });

        return Inertia::render('orders/index', [
            'orders' => $list,
            'filters' => $request->only('search', 'status', 'sort', 'date_from', 'date_to'),
        ]);
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

    public function show(Request $request, Order $order, MidtransService $midtrans, OrderService $orders): Response
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        // Keep a still-unpaid order in step with the latest book prices/details.
        if ($orders->syncPendingFromBooks($order)) {
            session()->flash('success', 'Harga/detail buku diperbarui ke versi terbaru.');
        }

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
