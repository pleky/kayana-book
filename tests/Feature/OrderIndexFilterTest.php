<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

function orderFor(User $user, array $attrs = []): Order
{
    return Order::factory()->for($user)->create($attrs);
}

it('filters the buyer orders by status', function () {
    $user = User::factory()->create();
    orderFor($user, ['status' => 'pending']);
    orderFor($user, ['status' => 'completed']);

    actingAs($user)
        ->get(route('orders.index', ['status' => 'completed']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/index')
            ->where('orders.data', fn ($data) => count($data) === 1
                && $data[0]['status'] === 'completed')
        );
});

it('searches orders by id', function () {
    $user = User::factory()->create();
    $target = orderFor($user);
    orderFor($user);

    actingAs($user)
        ->get(route('orders.index', ['search' => (string) $target->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => count($data) === 1
                && $data[0]['id'] === $target->id)
        );
});

it('sorts orders by highest total', function () {
    $user = User::factory()->create();
    orderFor($user, ['subtotal' => 10000, 'total' => 10000]);
    orderFor($user, ['subtotal' => 90000, 'total' => 90000]);

    actingAs($user)
        ->get(route('orders.index', ['sort' => 'total_desc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.total', 90000)
        );
});

it('flags a pending order on the list when its book details change', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['price' => 50000, 'status' => 'reserved']);
    $order = orderFor($user, ['status' => 'pending', 'subtotal' => 50000, 'total' => 50000]);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 50000]);

    actingAs($user)
        ->get(route('orders.index'))
        ->assertInertia(fn (Assert $page) => $page->where('orders.data.0.has_updates', false));

    $book->update(['price' => 70000]);

    actingAs($user)
        ->get(route('orders.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.has_updates', true)
            ->missing('orders.data.0.items.0.book')
        );
});

it('does not flag a paid order when its book changes', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['price' => 50000]);
    $order = orderFor($user, ['status' => 'paid', 'subtotal' => 50000, 'total' => 50000]);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 50000]);

    $book->update(['price' => 70000]);

    actingAs($user)
        ->get(route('orders.index'))
        ->assertInertia(fn (Assert $page) => $page->where('orders.data.0.has_updates', false));
});

it('only ever lists the current user orders', function () {
    $user = User::factory()->create();
    orderFor($user);
    orderFor(User::factory()->create());

    actingAs($user)
        ->get(route('orders.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => count($data) === 1)
        );
});
