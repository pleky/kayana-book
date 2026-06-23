<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\Payment\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly MidtransService $midtrans) {}

    /**
     * Issue a Midtrans Snap token for the buyer's own pending order. Called via
     * XHR from the order page; the frontend then opens the Snap popup. The real
     * source of truth for payment is the webhook, not this response.
     */
    public function pay(Request $request, Order $order, OrderService $orders): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 403);
        abort_unless($order->status === 'pending', 422, 'Pesanan tidak menunggu pembayaran.');

        // Charge the latest book prices; if they shifted, make the buyer review
        // the new total before opening the payment popup.
        if ($orders->syncPendingFromBooks($order)) {
            return response()->json([
                'repriced' => true,
                'message' => 'Harga diperbarui. Periksa total terbaru sebelum membayar.',
            ], 409);
        }

        if ($order->fulfillment === 'ship' && $order->shipping_cost === 0) {
            return response()->json(['message' => 'Ongkir belum dikonfirmasi penjual.'], 422);
        }

        if (! $this->midtrans->configured()) {
            return response()->json(['message' => 'Gateway belum aktif.'], 422);
        }

        $token = $this->midtrans->createSnapToken($order);

        if ($token === null) {
            return response()->json(['message' => 'Tidak bisa memulai pembayaran. Coba lagi.'], 422);
        }

        return response()->json(['snap_token' => $token]);
    }

    /**
     * Issue a Snap token for a guest (account-less) link order, keyed by its
     * `track_token`. No reprice — link orders are price-locked at creation and
     * their books are hidden from the catalog.
     */
    public function payGuest(Order $order): JsonResponse
    {
        abort_unless($order->channel === 'link', 404);
        abort_unless($order->status === 'pending', 422, 'Pesanan tidak menunggu pembayaran.');

        if ($order->fulfillment === 'ship' && $order->shipping_cost === 0) {
            return response()->json(['message' => 'Ongkir belum dikonfirmasi penjual.'], 422);
        }

        if (! $this->midtrans->configured()) {
            return response()->json(['message' => 'Gateway belum aktif.'], 422);
        }

        $token = $this->midtrans->createSnapToken($order);

        if ($token === null) {
            return response()->json(['message' => 'Tidak bisa memulai pembayaran. Coba lagi.'], 422);
        }

        return response()->json(['snap_token' => $token]);
    }

    /**
     * Midtrans server-to-server notification. Verify the signature, then mark
     * the matching order paid on settlement. Always answers 200 so Midtrans
     * stops retrying once we have acknowledged receipt.
     */
    public function notify(Request $request, OrderService $orders): JsonResponse
    {
        $payload = $request->all();

        if (! $this->midtrans->verifySignature($payload)) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        $order = Order::where('payment_reference', $payload['order_id'] ?? null)->first();

        if ($order === null) {
            return response()->json(['message' => 'Order not found.']);
        }

        if ($this->midtrans->mapStatus($payload) === 'paid') {
            $orders->markPaidFromGateway(
                $order,
                (string) ($payload['payment_type'] ?? 'midtrans'),
                (string) ($payload['order_id'] ?? ''),
            );
        }

        return response()->json(['message' => 'OK']);
    }
}
