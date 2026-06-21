<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

function configureMidtrans(): void
{
    config([
        'services.midtrans.server_key' => 'SB-test-server',
        'services.midtrans.client_key' => 'SB-test-client',
        'services.midtrans.base_url' => 'https://api.sandbox.midtrans.com',
    ]);
}

/**
 * Build a Midtrans notification with a valid signature for the given order.
 *
 * @return array<string, string>
 */
function midtransPayload(Order $order, string $transactionStatus = 'settlement'): array
{
    $grossAmount = number_format($order->total, 2, '.', '');
    $statusCode = '200';
    $signature = hash('sha512',
        $order->payment_reference.$statusCode.$grossAmount.config('services.midtrans.server_key'),
    );

    return [
        'order_id' => $order->payment_reference,
        'status_code' => $statusCode,
        'gross_amount' => $grossAmount,
        'transaction_status' => $transactionStatus,
        'fraud_status' => 'accept',
        'payment_type' => 'qris',
        'signature_key' => $signature,
    ];
}

it('issues a snap token for the buyer pending order', function () {
    configureMidtrans();
    Http::fake([
        'api.sandbox.midtrans.com/snap/v1/transactions' => Http::response(['token' => 'snap-tok-123']),
    ]);

    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create(['total' => 150000]);
    $book = Book::factory()->create(['status' => 'reserved']);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 150000]);

    actingAs($user)
        ->postJson(route('orders.pay', $order))
        ->assertOk()
        ->assertJson(['snap_token' => 'snap-tok-123']);

    $order->refresh();
    expect($order->snap_token)->toBe('snap-tok-123')
        ->and($order->payment_reference)->toStartWith('KAYANA-'.$order->id.'-')
        ->and($order->payment_gateway)->toBe('midtrans');
});

it('returns 422 when the gateway is not configured', function () {
    config(['services.midtrans.server_key' => null, 'services.midtrans.client_key' => null]);

    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    actingAs($user)
        ->postJson(route('orders.pay', $order))
        ->assertStatus(422);

    expect($order->refresh()->status)->toBe('pending');
});

it('blocks payment when ship ongkir is not confirmed yet', function () {
    configureMidtrans();

    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create([
        'fulfillment' => 'ship',
        'shipping_cost' => 0,
    ]);

    actingAs($user)
        ->postJson(route('orders.pay', $order))
        ->assertStatus(422)
        ->assertJson(['message' => 'Ongkir belum dikonfirmasi penjual.']);
});

it('forbids paying for someone else order', function () {
    configureMidtrans();
    $order = Order::factory()->create();

    actingAs(User::factory()->create())
        ->postJson(route('orders.pay', $order))
        ->assertForbidden();
});

it('marks the order paid on a valid settlement webhook', function () {
    configureMidtrans();

    $order = Order::factory()->create(['total' => 200000, 'payment_reference' => 'KAYANA-99-1']);
    $book = Book::factory()->create(['status' => 'reserved']);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 200000]);

    postJson(route('payment.notify'), midtransPayload($order))->assertOk();

    $order->refresh();
    expect($order->status)->toBe('paid')
        ->and($order->paid_at)->not->toBeNull()
        ->and($order->payment_channel)->toBe('qris')
        ->and($book->refresh()->status)->toBe('sold');
});

it('rejects a webhook with an invalid signature', function () {
    configureMidtrans();

    $order = Order::factory()->create(['payment_reference' => 'KAYANA-99-1']);

    $payload = midtransPayload($order);
    $payload['signature_key'] = 'tampered';

    postJson(route('payment.notify'), $payload)->assertStatus(403);

    expect($order->refresh()->status)->toBe('pending');
});

it('is idempotent across repeated webhooks', function () {
    configureMidtrans();

    $order = Order::factory()->create(['total' => 200000, 'payment_reference' => 'KAYANA-99-1']);
    $book = Book::factory()->create(['status' => 'reserved']);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 200000]);

    $payload = midtransPayload($order);
    postJson(route('payment.notify'), $payload)->assertOk();
    $paidAt = $order->refresh()->paid_at;

    postJson(route('payment.notify'), $payload)->assertOk();

    expect($order->refresh()->paid_at->equalTo($paidAt))->toBeTrue()
        ->and($order->status)->toBe('paid');
});
