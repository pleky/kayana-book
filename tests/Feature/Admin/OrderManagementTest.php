<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;
use function Pest\Laravel\post;

function adminUser(): User
{
    return User::factory()->create(['is_admin' => true]);
}

/**
 * Pending order with one reserved book, like post-checkout state.
 *
 * @return array{0: Order, 1: Book}
 */
function reservedOrder(string $fulfillment = 'pickup'): array
{
    $book = Book::factory()->reserved()->create(['price' => 40000]);
    $order = Order::factory()->create([
        'status' => 'pending',
        'subtotal' => 40000,
        'total' => 40000,
        'fulfillment' => $fulfillment,
    ]);
    $order->items()->create([
        'book_id' => $book->id,
        'title' => $book->title,
        'price' => $book->price,
    ]);

    return [$order, $book];
}

it('blocks guests and non-admins from order management', function () {
    get(route('admin.orders.index'))->assertRedirect(route('login'));

    actingAs(User::factory()->create(['is_admin' => false]));
    get(route('admin.orders.index'))->assertForbidden();
});

it('lets an admin list and view orders', function () {
    actingAs(adminUser());
    [$order] = reservedOrder();

    get(route('admin.orders.index'))->assertOk();
    get(route('admin.orders.show', $order))->assertOk();
});

it('marks an order paid and sells its books', function () {
    actingAs(adminUser());
    [$order, $book] = reservedOrder();

    post(route('admin.orders.pay', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe('paid')
        ->and($book->refresh()->status)->toBe('sold');
});

it('completes a paid order', function () {
    actingAs(adminUser());
    [$order] = reservedOrder();
    $order->update(['status' => 'paid', 'paid_at' => now()]);

    post(route('admin.orders.complete', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe('completed');
});

it('cancels an order and releases its books', function () {
    actingAs(adminUser());
    [$order, $book] = reservedOrder();

    post(route('admin.orders.cancel', $order), ['cancel_reason' => 'stok rusak'])
        ->assertRedirect();

    expect($order->refresh()->status)->toBe('cancelled')
        ->and($order->cancel_reason)->toBe('stok rusak')
        ->and($book->refresh()->status)->toBe('available');
});

it('sets shipping cost and recomputes the total', function () {
    actingAs(adminUser());
    [$order] = reservedOrder('ship');

    patch(route('admin.orders.update', $order), ['shipping_cost' => 15000])
        ->assertRedirect();

    $order->refresh();

    expect($order->shipping_cost)->toBe(15000)
        ->and($order->total)->toBe(55000);
});

it('refuses to pay an order that is not pending', function () {
    actingAs(adminUser());
    [$order] = reservedOrder();
    $order->update(['status' => 'paid']);

    post(route('admin.orders.pay', $order))->assertStatus(422);
});
