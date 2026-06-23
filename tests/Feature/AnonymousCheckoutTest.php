<?php

use App\Enums\CheckoutLinkStatus;
use App\Models\Book;
use App\Models\CheckoutLink;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

/**
 * Active pickup link holding the given available books (and hiding them).
 *
 * @param  list<Book>  $books
 */
function activeLink(array $books, array $attrs = []): CheckoutLink
{
    $link = CheckoutLink::create(array_merge([
        'token' => Str::random(40),
        'status' => 'active',
        'shipping_mode' => 'pickup',
        'shipping_cost' => 0,
    ], $attrs));

    $ids = collect($books)->pluck('id')->all();
    $link->books()->attach($ids);
    Book::whereIn('id', $ids)->update(['is_unlisted' => true]);

    return $link;
}

it('lets a guest check out from a valid link', function () {
    $book = Book::factory()->create(['status' => 'available', 'price' => 60000]);
    $link = activeLink([$book]);

    post(route('checkout-link.store', $link->token), [
        'customer_name' => 'Budi',
        'customer_phone' => '08123',
    ])->assertRedirect();

    $order = Order::first();
    expect($order)->not->toBeNull()
        ->and($order->user_id)->toBeNull()
        ->and($order->channel)->toBe('link')
        ->and($order->track_token)->not->toBeNull()
        ->and($order->total)->toBe(60000)
        ->and($book->refresh()->status)->toBe('reserved')
        ->and($link->refresh()->order_id)->toBe($order->id);
});

it('applies admin-set shipping to the order', function () {
    $book = Book::factory()->create(['status' => 'available', 'price' => 50000]);
    $link = activeLink([$book], [
        'shipping_mode' => 'admin_set',
        'shipping_cost' => 15000,
        'recipient_name' => 'Budi',
        'shipping_address' => 'Jl. Mawar 1',
    ]);

    post(route('checkout-link.store', $link->token), [
        'customer_name' => 'Budi',
        'customer_phone' => '08123',
    ])->assertRedirect();

    $order = Order::first();
    expect($order->fulfillment)->toBe('ship')
        ->and($order->shipping_cost)->toBe(15000)
        ->and($order->total)->toBe(65000)
        ->and($order->shipping_address)->toBe('Jl. Mawar 1');
});

it('404s an invalid, revoked, or expired link', function () {
    get(route('checkout-link.show', 'nonexistent-token'))->assertNotFound();

    $book = Book::factory()->create(['status' => 'available']);
    $revoked = activeLink([$book], ['status' => 'revoked']);
    get(route('checkout-link.show', $revoked->token))->assertNotFound();

    $book2 = Book::factory()->create(['status' => 'available']);
    $expired = activeLink([$book2], ['expires_at' => now()->subDay()]);
    get(route('checkout-link.show', $expired->token))->assertNotFound();
});

it('blocks checkout when a linked book is already sold', function () {
    $book = Book::factory()->create(['status' => 'available']);
    $link = activeLink([$book]);
    $book->update(['status' => 'sold']);

    post(route('checkout-link.store', $link->token), [
        'customer_name' => 'Budi',
        'customer_phone' => '08123',
    ])->assertSessionHas('error');

    expect(Order::count())->toBe(0);
});

it('hides unlisted books from the catalog', function () {
    $listed = Book::factory()->create(['status' => 'available', 'is_unlisted' => false]);
    $hidden = Book::factory()->create(['status' => 'available', 'is_unlisted' => true]);

    get(route('catalog.show', $listed->slug))->assertOk();
    get(route('catalog.show', $hidden->slug))->assertNotFound();
});

it('shows guest tracking by track token only', function () {
    $book = Book::factory()->create(['status' => 'available']);
    $link = activeLink([$book]);
    post(route('checkout-link.store', $link->token), [
        'customer_name' => 'Budi',
        'customer_phone' => '08123',
    ]);
    $order = Order::first();

    get(route('guest.orders.show', $order->track_token))->assertOk();
    get(route('guest.orders.show', 'wrong-token'))->assertNotFound();
});

it('lets admin create a link and hides its books', function () {
    actingAs(User::factory()->create(['is_admin' => true]));
    $book = Book::factory()->create(['status' => 'available', 'is_unlisted' => false]);

    post(route('admin.checkout-links.store'), [
        'book_ids' => [$book->id],
        'shipping_mode' => 'pickup',
        'shipping_cost' => 0,
    ])->assertRedirect();

    expect(CheckoutLink::count())->toBe(1)
        ->and($book->refresh()->is_unlisted)->toBeTrue();
});

it('relists books when admin revokes a link', function () {
    actingAs(User::factory()->create(['is_admin' => true]));
    $book = Book::factory()->create(['status' => 'available']);
    $link = activeLink([$book]);

    post(route('admin.checkout-links.revoke', $link->token))->assertRedirect();

    expect($link->refresh()->status)->toBe(CheckoutLinkStatus::Revoked)
        ->and($book->refresh()->is_unlisted)->toBeFalse();
});

it('forbids non-admins from managing links', function () {
    actingAs(User::factory()->create(['is_admin' => false]));
    get(route('admin.checkout-links.index'))->assertForbidden();
});
