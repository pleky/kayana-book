<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

it('hides metrics from non-admin users', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]));

    $this->get(route('dashboard'))->assertInertia(
        fn (Assert $page) => $page->where('metrics', null)
    );
});

it('shows revenue and stock metrics to admins', function () {
    $this->actingAs(User::factory()->create(['is_admin' => true]));

    Order::factory()->paid()->create(['total' => 75000, 'paid_at' => now()]);
    Order::factory()->create(['status' => 'pending']);
    Book::factory()->sold()->create();
    Book::factory()->count(2)->create(['status' => 'available']);

    $this->get(route('dashboard'))->assertInertia(
        fn (Assert $page) => $page
            ->where('metrics.revenue_today', 75000)
            ->where('metrics.revenue_month', 75000)
            ->where('metrics.orders_pending', 1)
            ->where('metrics.books_sold', 1)
            ->where('metrics.books_available', 2)
    );
});
