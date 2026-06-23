<?php

use App\Models\Book;
use App\Models\Order;
use App\Services\OrderService;
use Carbon\CarbonInterface;

use function Pest\Laravel\artisan;

/**
 * Build a pending order holding one reserved book, mirroring post-checkout
 * state.
 *
 * @return array{0: Order, 1: Book}
 */
function pendingOrderWithReservedBook(?CarbonInterface $expiresAt = null): array
{
    $book = Book::factory()->reserved()->create(['price' => 40000]);
    $order = Order::factory()->create([
        'status' => 'pending',
        'subtotal' => 40000,
        'total' => 40000,
        'expires_at' => $expiresAt ?? now()->addDay(),
    ]);
    $order->items()->create([
        'book_id' => $book->id,
        'title' => $book->title,
        'price' => $book->price,
    ]);

    return [$order, $book];
}

it('marks an order paid and sells its reserved books', function () {
    [$order, $book] = pendingOrderWithReservedBook();

    app(OrderService::class)->markPaid($order);

    expect($order->refresh()->status)->toBe('paid')
        ->and($order->paid_at)->not->toBeNull()
        ->and($order->expires_at)->toBeNull()
        ->and($book->refresh()->status)->toBe('sold')
        ->and($book->sold_at)->not->toBeNull();
});

it('cancels an order and releases its reserved books', function () {
    [$order, $book] = pendingOrderWithReservedBook();

    app(OrderService::class)->cancel($order, 'dibatalkan pemilik');

    expect($order->refresh()->status)->toBe('cancelled')
        ->and($order->cancel_reason)->toBe('dibatalkan pemilik')
        ->and($book->refresh()->status)->toBe('available');
});

it('does not touch already-sold books when cancelling', function () {
    [$order, $book] = pendingOrderWithReservedBook();
    $book->update(['status' => 'sold', 'sold_at' => now()]);

    app(OrderService::class)->cancel($order, 'expired');

    expect($book->refresh()->status)->toBe('sold');
});

it('releases only expired pending orders', function () {
    [$expiredOrder, $expiredBook] = pendingOrderWithReservedBook(now()->subHour());
    [$freshOrder, $freshBook] = pendingOrderWithReservedBook(now()->addHour());

    $released = app(OrderService::class)->releaseExpired();

    expect($released)->toBe(1)
        ->and($expiredOrder->refresh()->status)->toBe('cancelled')
        ->and($expiredOrder->cancel_reason)->toBe('expired')
        ->and($expiredBook->refresh()->status)->toBe('available')
        ->and($freshOrder->refresh()->status)->toBe('pending')
        ->and($freshBook->refresh()->status)->toBe('reserved');
});

it('releases expired orders via the scheduled command', function () {
    [$order, $book] = pendingOrderWithReservedBook(now()->subHour());

    artisan('orders:release-expired')
        ->expectsOutputToContain('Released 1 expired order(s).')
        ->assertExitCode(0);

    expect($order->refresh()->status)->toBe('cancelled')
        ->and($book->refresh()->status)->toBe('available');
});

it('auto-completes only shipped orders past the grace window', function () {
    $stale = Order::factory()->create([
        'status' => 'shipped',
        'fulfillment' => 'ship',
        'shipped_at' => now()->subDays(OrderService::AUTO_COMPLETE_DAYS + 1),
    ]);
    $recent = Order::factory()->create([
        'status' => 'shipped',
        'fulfillment' => 'ship',
        'shipped_at' => now()->subDay(),
    ]);

    $completed = app(OrderService::class)->autoCompleteShipped();

    expect($completed)->toBe(1)
        ->and($stale->refresh()->status)->toBe('completed')
        ->and($recent->refresh()->status)->toBe('shipped');
});
