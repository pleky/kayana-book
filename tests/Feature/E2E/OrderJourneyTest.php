<?php

use App\Models\Book;
use App\Models\User;
use App\Notifications\OrderCompleted;
use App\Notifications\OrderPaid;
use App\Notifications\OrderReadyToPay;
use App\Notifications\OrderShipped;
use App\Services\OrderService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\artisan;
use function Pest\Laravel\postJson;

/*
|--------------------------------------------------------------------------
| End-to-end order journeys
|--------------------------------------------------------------------------
| Each test drives a full buyer + seller lifecycle through the real stack
| (routes → controllers → OrderService → DB → notifications). The browser/JS
| layer (Snap popup, inline modal clicks) is out of scope; Midtrans HTTP and
| mail are faked.
*/

/** Turn on the Midtrans gateway with sandbox test keys. */
function journeyEnableGateway(): void
{
    config([
        'services.midtrans.server_key' => 'SB-journey-server',
        'services.midtrans.client_key' => 'SB-journey-client',
        'services.midtrans.base_url' => 'https://api.sandbox.midtrans.com',
    ]);
}

/** Build a signed Midtrans settlement notification for an order. */
function journeyWebhook(string $reference, int $total): array
{
    $gross = number_format($total, 2, '.', '');
    $statusCode = '200';

    return [
        'order_id' => $reference,
        'status_code' => $statusCode,
        'gross_amount' => $gross,
        'transaction_status' => 'settlement',
        'fraud_status' => 'accept',
        'payment_type' => 'qris',
        'signature_key' => hash('sha512', $reference.$statusCode.$gross.config('services.midtrans.server_key')),
    ];
}

it('runs the full ship journey: add address → ongkir → gateway pay → ship → received', function () {
    Notification::fake();
    journeyEnableGateway();
    Http::fake([
        'api.sandbox.midtrans.com/snap/v1/transactions' => Http::response(['token' => 'snap-journey-1']),
    ]);

    $seller = User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    $book = Book::factory()->create(['status' => 'available', 'price' => 120000]);

    // 1. Buyer fills the cart and opens checkout — no saved address yet.
    actingAs($buyer)->post(route('cart.store', $book))->assertRedirect();

    actingAs($buyer)
        ->get(route('checkout.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('checkout/create')
            ->where('subtotal', 120000)
            ->where('addresses', [])
        );

    // 2. Buyer adds an address from the checkout flow → bounced back to checkout.
    actingAs($buyer)
        ->post(route('addresses.store'), [
            'label' => 'Rumah',
            'recipient_name' => 'Sari',
            'recipient_phone' => '08123456789',
            'address_line' => 'Jl. Melati 5, Denpasar',
            'postal_code' => '80113',
            'redirect_to' => 'checkout',
        ])
        ->assertRedirect(route('checkout.create'));

    $address = $buyer->addresses()->firstOrFail();

    // 3. Buyer places a ship order (no courier picked → ongkir pending).
    actingAs($buyer)
        ->post(route('checkout.store'), [
            'customer_name' => 'Sari',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
            'user_address_id' => $address->id,
        ])
        ->assertRedirect();

    $order = $buyer->orders()->firstOrFail();
    expect($order->status)->toBe('pending')
        ->and($order->total)->toBe(120000)
        ->and($book->refresh()->status)->toBe('reserved');

    // 4. Payment is blocked until the seller confirms ongkir.
    actingAs($buyer)->postJson(route('orders.pay', $order))->assertStatus(422);

    // 5. Seller sets ongkir → buyer notified it's ready to pay, total recomputed.
    actingAs($seller)
        ->patch(route('admin.orders.update', $order), ['shipping_cost' => 18000])
        ->assertRedirect();

    expect($order->refresh()->total)->toBe(138000);
    Notification::assertSentTo($buyer, OrderReadyToPay::class);

    // 6. Buyer starts payment → Snap token issued, reference stored.
    actingAs($buyer)
        ->postJson(route('orders.pay', $order))
        ->assertOk()
        ->assertJson(['snap_token' => 'snap-journey-1']);

    $order->refresh();
    expect($order->payment_reference)->not->toBeNull();

    // 7. Midtrans webhook settles the payment → paid, books sold, seller alerted.
    postJson(route('payment.notify'), journeyWebhook($order->payment_reference, $order->total))
        ->assertOk();

    $order->refresh();
    expect($order->status)->toBe('paid')
        ->and($order->paid_at)->not->toBeNull()
        ->and($book->refresh()->status)->toBe('sold');
    Notification::assertSentTo($seller, OrderPaid::class);

    // 8. Seller ships with a tracking number → buyer notified.
    actingAs($seller)
        ->post(route('admin.orders.ship', $order), ['tracking_number' => 'JNE0099887766'])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('shipped')
        ->and($order->shipping_tracking_number)->toBe('JNE0099887766');
    Notification::assertSentTo($buyer, OrderShipped::class);

    // 9. Buyer sees the resi on the order page.
    actingAs($buyer)
        ->get(route('orders.show', $order))
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->where('order.status', 'shipped')
            ->where('order.shipping_tracking_number', 'JNE0099887766')
        );

    // 10. Buyer confirms receipt → completed, seller notified.
    actingAs($buyer)
        ->post(route('orders.received', $order))
        ->assertRedirect();

    expect($order->refresh()->status)->toBe('completed');
    Notification::assertSentTo($seller, OrderCompleted::class);
});

it('runs the pickup journey with manual transfer (gateway off)', function () {
    Notification::fake();
    config(['services.midtrans.server_key' => null, 'services.midtrans.client_key' => null]);

    $seller = User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    $book = Book::factory()->create(['status' => 'available', 'price' => 75000]);

    actingAs($buyer)->post(route('cart.store', $book))->assertRedirect();

    // Pickup needs no address; order is payable immediately.
    actingAs($buyer)
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08987654321',
            'fulfillment' => 'pickup',
        ])
        ->assertRedirect();

    $order = $buyer->orders()->firstOrFail();
    expect($order->total)->toBe(75000);

    // Gateway off → the order page shows manual bank transfer, pay endpoint 422.
    actingAs($buyer)
        ->get(route('orders.show', $order))
        ->assertInertia(fn (Assert $page) => $page
            ->where('payment.gateway_enabled', false)
            ->where('bank.bank', 'BCA')
        );
    actingAs($buyer)->postJson(route('orders.pay', $order))->assertStatus(422);

    // Seller confirms the transfer manually, then completes the pickup.
    actingAs($seller)->post(route('admin.orders.pay', $order))->assertRedirect();
    expect($order->refresh()->status)->toBe('paid')
        ->and($book->refresh()->status)->toBe('sold');
    Notification::assertSentTo($seller, OrderPaid::class);

    actingAs($seller)->post(route('admin.orders.complete', $order))->assertRedirect();
    expect($order->refresh()->status)->toBe('completed');
    Notification::assertSentTo($seller, OrderCompleted::class);
});

it('auto-completes a shipped order the buyer never confirms', function () {
    Notification::fake();

    User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    $book = Book::factory()->reserved()->create(['price' => 60000]);

    $order = $buyer->orders()->create([
        'status' => 'shipped',
        'channel' => 'online',
        'subtotal' => 60000,
        'shipping_cost' => 0,
        'total' => 60000,
        'customer_name' => 'Sari',
        'customer_phone' => '0811',
        'fulfillment' => 'ship',
        'payment_method' => 'transfer',
        'paid_at' => now()->subDays(OrderService::AUTO_COMPLETE_DAYS + 2),
        'shipped_at' => now()->subDays(OrderService::AUTO_COMPLETE_DAYS + 1),
    ]);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 60000]);

    artisan('orders:auto-complete-shipped')->assertSuccessful();

    expect($order->refresh()->status)->toBe('completed');
});

it('rejects a checkout that races for an already-taken book', function () {
    $buyer = User::factory()->create();
    $book = Book::factory()->create(['status' => 'available', 'price' => 50000]);

    actingAs($buyer)->post(route('cart.store', $book))->assertRedirect();

    // Someone else grabs the unique copy first.
    $book->update(['status' => 'reserved']);

    actingAs($buyer)
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08111',
            'fulfillment' => 'pickup',
        ])
        ->assertRedirect(route('cart.index'));

    expect($buyer->orders()->count())->toBe(0);
});
