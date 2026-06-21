<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderCompleted;
use App\Notifications\OrderPaid;
use App\Notifications\OrderReadyToPay;
use App\Notifications\OrderShipped;
use App\Services\OrderService;
use Illuminate\Support\Facades\Notification;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\artisan;

/**
 * Pending ship order with one reserved book owned by the given buyer.
 *
 * @return array{0: Order, 1: Book}
 */
function shipOrderFor(User $buyer, string $status = 'pending'): array
{
    $book = Book::factory()->reserved()->create(['price' => 50000]);
    $order = Order::factory()->for($buyer)->create([
        'status' => $status,
        'subtotal' => 50000,
        'total' => 50000,
        'fulfillment' => 'ship',
        'shipping_courier' => 'jne',
        'shipping_service' => 'REG',
    ]);
    $order->items()->create([
        'book_id' => $book->id,
        'title' => $book->title,
        'price' => $book->price,
    ]);

    return [$order, $book];
}

it('notifies the buyer when the seller sets ongkir on a ship order', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    [$order] = shipOrderFor($buyer);

    actingAs($admin)
        ->patch(route('admin.orders.update', $order), ['shipping_cost' => 15000])
        ->assertRedirect();

    expect($order->refresh()->total)->toBe(65000);
    Notification::assertSentTo($buyer, OrderReadyToPay::class);
});

it('notifies admins when an order is marked paid', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    [$order] = shipOrderFor($buyer);

    actingAs($admin)
        ->post(route('admin.orders.pay', $order))
        ->assertRedirect();

    Notification::assertSentTo($admin, OrderPaid::class);
});

it('lets the seller mark a paid ship order shipped with a resi', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    [$order] = shipOrderFor($buyer, 'paid');

    actingAs($admin)
        ->post(route('admin.orders.ship', $order), ['tracking_number' => 'JNE0012345678'])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('shipped')
        ->and($order->shipping_tracking_number)->toBe('JNE0012345678')
        ->and($order->shipped_at)->not->toBeNull();

    Notification::assertSentTo($buyer, OrderShipped::class);
});

it('cannot ship an order that is not paid', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    [$order] = shipOrderFor(User::factory()->create()); // pending

    actingAs($admin)
        ->post(route('admin.orders.ship', $order), ['tracking_number' => 'X'])
        ->assertStatus(422);

    expect($order->refresh()->status)->toBe('pending');
});

it('lets the buyer confirm receipt of a shipped order', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();
    [$order] = shipOrderFor($buyer, 'shipped');

    actingAs($buyer)
        ->post(route('orders.received', $order))
        ->assertRedirect();

    expect($order->refresh()->status)->toBe('completed');
    Notification::assertSentTo($admin, OrderCompleted::class);
});

it('forbids confirming receipt of another buyer order', function () {
    [$order] = shipOrderFor(User::factory()->create(), 'shipped');

    actingAs(User::factory()->create())
        ->post(route('orders.received', $order))
        ->assertForbidden();
});

it('cannot confirm receipt before the order is shipped', function () {
    $buyer = User::factory()->create();
    [$order] = shipOrderFor($buyer, 'paid');

    actingAs($buyer)
        ->post(route('orders.received', $order))
        ->assertStatus(422);
});

it('auto-completes shipped orders past the grace window', function () {
    User::factory()->create(['is_admin' => true]);
    $buyer = User::factory()->create();

    [$stale] = shipOrderFor($buyer, 'shipped');
    $stale->update(['shipped_at' => now()->subDays(OrderService::AUTO_COMPLETE_DAYS + 1)]);

    [$fresh] = shipOrderFor($buyer, 'shipped');
    $fresh->update(['shipped_at' => now()->subDay()]);

    artisan('orders:auto-complete-shipped')->assertSuccessful();

    expect($stale->refresh()->status)->toBe('completed')
        ->and($fresh->refresh()->status)->toBe('shipped');
});
