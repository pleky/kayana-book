<?php

use App\Models\Book;

use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

it('adds an available book to the session cart', function () {
    $book = Book::factory()->create(['status' => 'available']);

    post(route('cart.store', $book))->assertRedirect();

    get(route('cart.index'))->assertInertia(
        fn ($page) => $page->component('cart/index')->has('items', 1)
    );
});

it('does not add a sold book to the cart', function () {
    $book = Book::factory()->sold()->create();

    post(route('cart.store', $book))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(session('cart', []))->toBe([]);
});

it('drops books that became unavailable from the cart view', function () {
    $book = Book::factory()->create(['status' => 'available']);

    post(route('cart.store', $book));
    $book->update(['status' => 'sold']);

    get(route('cart.index'))->assertInertia(
        fn ($page) => $page->has('items', 0)
    );
});

it('removes a book from the cart', function () {
    $book = Book::factory()->create();

    post(route('cart.store', $book));
    delete(route('cart.destroy', $book))->assertRedirect();

    get(route('cart.index'))->assertInertia(
        fn ($page) => $page->has('items', 0)
    );
});

it('allows guests to use the cart', function () {
    $book = Book::factory()->create();

    post(route('cart.store', $book))->assertRedirect();
    get(route('cart.index'))->assertOk();
});
