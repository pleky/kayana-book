<?php

use App\Models\Book;
use App\Models\Category;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('renders the landing with only in-stock categories and their counts', function () {
    $stocked = Category::factory()->create(['name' => 'Novel', 'slug' => 'novel']);
    $empty = Category::factory()->create(['name' => 'Sastra', 'slug' => 'sastra']);

    Book::factory()->create(['category_id' => $stocked->id, 'status' => 'available']);
    Book::factory()->sold()->create(['category_id' => $empty->id]);

    get(route('home'))->assertInertia(
        fn (Assert $page) => $page
            ->component('welcome')
            ->has('categories', 1)
            ->where('categories.0.slug', 'novel')
            ->where('categories.0.books_count', 1)
    );
});

it('shows only the top 5 categories by available book count, most first', function () {
    foreach (range(1, 6) as $n) {
        $category = Category::factory()->create(['slug' => "cat-{$n}"]);
        Book::factory()->count($n)->create([
            'category_id' => $category->id,
            'status' => 'available',
        ]);
    }

    get(route('home'))->assertInertia(
        fn (Assert $page) => $page
            ->has('categories', 5)
            ->where('categories.0.slug', 'cat-6')
            ->where('categories.0.books_count', 6)
            ->where('categories.4.books_count', 2)
    );
});
