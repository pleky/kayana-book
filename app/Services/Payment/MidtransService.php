<?php

namespace App\Services\Payment;

use App\Models\Order;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Thin client for Midtrans Snap (hosted popup checkout). Mirrors the
 * RajaOngkirService pattern: Http facade + config-driven + graceful degradation
 * so the order page can fall back to manual bank transfer when the gateway is
 * not configured or the API is unreachable.
 *
 * Sandbox vs production base URLs are switched via MIDTRANS_IS_PRODUCTION.
 */
class MidtransService
{
    /**
     * Whether the gateway is wired up. When false the UI shows manual transfer
     * instructions instead of a "pay now" button.
     */
    public function configured(): bool
    {
        return filled(config('services.midtrans.server_key'))
            && filled(config('services.midtrans.client_key'));
    }

    /**
     * Create a Snap transaction for an order and return its token. The unique
     * Midtrans order_id is persisted as `payment_reference` so the webhook can
     * map a notification back to this order. Returns null on failure — the
     * caller then keeps the order pending and surfaces the manual fallback.
     */
    public function createSnapToken(Order $order): ?string
    {
        if (! $this->configured()) {
            return null;
        }

        $reference = $this->buildReference($order);

        try {
            $response = $this->http()->post('/snap/v1/transactions', [
                'transaction_details' => [
                    'order_id' => $reference,
                    'gross_amount' => $order->total,
                ],
                'item_details' => $this->itemDetails($order),
                'customer_details' => [
                    'first_name' => $order->customer_name,
                    'phone' => $order->customer_phone,
                ],
                'expiry' => $this->expiry($order),
            ]);
        } catch (\Throwable) {
            return null;
        }

        if ($response->failed()) {
            return null;
        }

        $token = (string) $response->json('token');

        if ($token === '') {
            return null;
        }

        $order->update([
            'payment_gateway' => 'midtrans',
            'payment_reference' => $reference,
            'snap_token' => $token,
        ]);

        return $token;
    }

    /**
     * Verify a webhook notification's HMAC. Midtrans signs every notification
     * with SHA512(order_id + status_code + gross_amount + server_key). Reject
     * anything that does not match before trusting the payload.
     *
     * @param  array<string, mixed>  $payload
     */
    public function verifySignature(array $payload): bool
    {
        $expected = hash('sha512',
            ((string) ($payload['order_id'] ?? ''))
            .((string) ($payload['status_code'] ?? ''))
            .((string) ($payload['gross_amount'] ?? ''))
            .(string) config('services.midtrans.server_key'),
        );

        return hash_equals($expected, (string) ($payload['signature_key'] ?? ''));
    }

    /**
     * Map a Midtrans transaction_status to our internal payment outcome.
     *
     * @param  array<string, mixed>  $payload
     * @return 'paid'|'pending'|'failed'
     */
    public function mapStatus(array $payload): string
    {
        $status = (string) ($payload['transaction_status'] ?? '');
        $fraud = (string) ($payload['fraud_status'] ?? 'accept');

        if (in_array($status, ['settlement', 'capture'], true)) {
            return $fraud === 'deny' ? 'failed' : 'paid';
        }

        if (in_array($status, ['expire', 'cancel', 'deny', 'failure'], true)) {
            return 'failed';
        }

        return 'pending';
    }

    /**
     * Build the line items sent to Midtrans. Their sum MUST equal gross_amount,
     * so the book snapshots plus a shipping line reconstruct the order total.
     *
     * @return list<array{id: string, price: int, quantity: int, name: string}>
     */
    private function itemDetails(Order $order): array
    {
        $items = $order->items->map(fn ($item): array => [
            'id' => (string) ($item->book_id ?? $item->id),
            'price' => (int) $item->price,
            'quantity' => 1,
            'name' => mb_substr((string) $item->title, 0, 50),
        ])->values()->all();

        if ((int) $order->shipping_cost > 0) {
            $items[] = [
                'id' => 'shipping',
                'price' => (int) $order->shipping_cost,
                'quantity' => 1,
                'name' => 'Ongkir',
            ];
        }

        return $items;
    }

    /**
     * Match the Snap expiry to the order's reservation window so the gateway and
     * our auto-release (ADR-004) stay aligned. Defaults to 60 minutes.
     *
     * @return array{unit: string, duration: int}
     */
    private function expiry(Order $order): array
    {
        $minutes = $order->expires_at
            ? (int) max(1, now()->diffInMinutes($order->expires_at, false))
            : 60;

        return ['unit' => 'minute', 'duration' => max(1, $minutes)];
    }

    /**
     * A unique-per-attempt order_id. Midtrans rejects a reused order_id, so the
     * current timestamp lets a buyer retry payment after a prior attempt.
     */
    private function buildReference(Order $order): string
    {
        return 'KAYANA-'.$order->id.'-'.now()->timestamp;
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl((string) config('services.midtrans.base_url'))
            ->timeout((int) config('services.midtrans.timeout'))
            ->withBasicAuth((string) config('services.midtrans.server_key'), '')
            ->acceptJson();
    }
}
