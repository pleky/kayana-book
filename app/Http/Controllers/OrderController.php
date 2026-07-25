<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\Payment\MidtransService;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        Gate::authorize('view', $order);

        // Keep a still-unpaid order in step with the latest book prices/details.
        if ($orders->syncPendingFromBooks($order)) {
            session()->flash('success', 'Harga/detail buku diperbarui ke versi terbaru.');
        }

        $order->load(['items', 'events']);

        return Inertia::render('orders/show', [
            'order' => $order,
            'events' => $order->events,
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
            'proofCount' => count($order->received_proof_paths ?? []),
            'maxProofs' => OrderService::MAX_PROOFS,
        ]);
    }

    /**
     * Buyer confirms the shipped order has arrived (ship only). Proof photos are
     * uploaded separately ({@see uploadProofs}). Finishes the order.
     */
    public function confirmReceived(Request $request, Order $order, OrderService $orders): RedirectResponse
    {
        Gate::authorize('confirmReceived', $order);
        abort_unless($order->fulfillment === 'ship' && $order->status === 'shipped', 422, 'Pesanan belum dikirim.');

        $orders->confirmReceived($order);

        return back()->with('success', 'Terima kasih, pesanan selesai.');
    }

    /**
     * Append up to MAX_PROOFS shipment-proof photos to a ship order (partial
     * upload — callable repeatedly). Stored on the private disk.
     */
    public function uploadProofs(Request $request, Order $order, OrderService $orders): RedirectResponse
    {
        Gate::authorize('uploadProof', $order);
        abort_unless($order->fulfillment === 'ship' && in_array($order->status, ['shipped', 'completed'], true), 422, 'Pesanan belum dikirim.');

        $remaining = OrderService::MAX_PROOFS - count($order->received_proof_paths ?? []);
        abort_if($remaining < 1, 422, 'Bukti sudah maksimal ('.OrderService::MAX_PROOFS.' foto).');

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:'.$remaining],
            'photos.*' => ['image', 'max:5120'],
        ]);

        $paths = collect($request->file('photos'))
            ->map(fn ($photo): string => $photo->store('order-proofs', 'local'))
            ->all();

        $orders->addProofs($order, $paths);

        return back()->with('success', 'Bukti pengiriman diunggah.');
    }

    /**
     * Stream a private proof photo (by index) to the order's owner or an admin.
     */
    public function proof(Request $request, Order $order, int $index): StreamedResponse
    {
        Gate::authorize('viewProof', $order);

        $path = ($order->received_proof_paths ?? [])[$index] ?? null;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }
}
