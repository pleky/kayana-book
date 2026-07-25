<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

/**
 * Pending order holding one book at the given price.
 *
 * @return array{0: Order, 1: Book}
 */
function pricedOrder(User $user, int $price, string $status = 'pending'): array
{
    $book = Book::factory()->create(['price' => $price, 'status' => 'reserved']);
    $order = Order::factory()->for($user)->create([
        'status' => $status,
        'subtotal' => $price,
        'total' => $price,
        'shipping_cost' => 0,
        'fulfillment' => 'pickup',
    ]);
    $order->items()->create([
        'book_id' => $book->id,
        'title' => $book->title,
        'price' => $price,
    ]);

    return [$order, $book];
}

it('refreshes a pending order to the latest book price when viewed', function () {
    $user = User::factory()->create();
    [$order, $book] = pricedOrder($user, 50000);

    $book->update(['price' => 70000]);

    actingAs($user)
        ->get(route('orders.show', $order))
        ->assertInertia(fn (Assert $page) => $page->where('order.total', 70000));

    expect($order->refresh()->total)->toBe(70000);
});

it('keeps a paid order frozen when the book price changes', function () {
    $user = User::factory()->create();
    [$order, $book] = pricedOrder($user, 50000, 'paid');

    $book->update(['price' => 70000]);

    actingAs($user)
        ->get(route('orders.show', $order))
        ->assertInertia(fn (Assert $page) => $page->where('order.total', 50000));

    expect($order->refresh()->total)->toBe(50000);
});

it('reprices and blocks payment when the book price changed', function () {
    $user = User::factory()->create();
    [$order, $book] = pricedOrder($user, 50000);

    $book->update(['price' => 70000]);

    actingAs($user)
        ->postJson(route('orders.pay', $order))
        ->assertStatus(409)
        ->assertJson(['repriced' => true]);

    expect($order->refresh()->total)->toBe(70000);
});

it('records a detail-update event when the book title changes', function () {
    $user = User::factory()->create();
    [$order, $book] = pricedOrder($user, 50000);

    $book->update(['title' => 'Judul Baru']);

    actingAs($user)->get(route('orders.show', $order))->assertOk();

    $event = $order->events()->where('type', 'repriced')->first();
    expect($event)->not->toBeNull()
        ->and($event->meta['items'][0]['title_to'])->toBe('Judul Baru');
});

it('snapshots the book cover onto a pending order item', function () {
    $user = User::factory()->create();
    [$order, $book] = pricedOrder($user, 50000);
    $book->images()->create([
        'path' => 'books/cover.png',
        'is_primary' => true,
        'sort_order' => 0,
    ]);

    actingAs($user)->get(route('orders.show', $order))->assertOk();

    expect($order->items()->first()->cover_path)->toBe('books/cover.png');
});
