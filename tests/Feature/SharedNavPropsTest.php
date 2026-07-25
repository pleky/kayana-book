<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('shares the category nav on the storefront', function () {
    Category::factory()->create(['name' => 'Fiksi']);

    get(route('home'))->assertInertia(
        fn ($page) => $page->has('navCategories', 1)
            ->where('navCategories.0.name', 'Fiksi'),
    );
});

it('skips the category nav on admin pages', function () {
    Category::factory()->create();

    actingAs(User::factory()->create(['is_admin' => true]))
        ->get(route('admin.books.index'))
        ->assertInertia(fn ($page) => $page->where('navCategories', []));
});

it('busts the nav cache when a category changes', function () {
    get(route('home')); // warms the cache (empty)

    Category::factory()->create(['name' => 'Sains']);

    expect(Cache::get(Category::NAV_CACHE_KEY))->toBeNull();

    get(route('home'))->assertInertia(
        fn ($page) => $page->has('navCategories', 1),
    );
});
