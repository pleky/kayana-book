<?php

use App\Models\Book;
use App\Models\Category;
use App\Models\Tag;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('lists only available books', function () {
    Book::factory()->create(['status' => 'available']);
    Book::factory()->sold()->create();
    Book::factory()->reserved()->create();

    get(route('catalog.index'))->assertInertia(
        fn (Assert $page) => $page
            ->component('catalog/index')
            ->has('books.data', 1)
    );
});

it('filters by category slug', function () {
    $category = Category::factory()->create(['slug' => 'novel']);
    Book::factory()->create(['category_id' => $category->id]);
    Book::factory()->create();

    get(route('catalog.index', ['category' => 'novel']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
    );
});

it('includes sub-category books when filtering by a root category', function () {
    $root = Category::factory()->create(['slug' => 'fiksi', 'parent_id' => null]);
    $child = Category::factory()->create(['parent_id' => $root->id]);
    Book::factory()->create(['category_id' => $root->id]);
    Book::factory()->create(['category_id' => $child->id]);
    Book::factory()->create(); // uncategorised, excluded

    get(route('catalog.index', ['category' => 'fiksi']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 2)
    );
});

it('sorts by cheapest price first', function () {
    Book::factory()->create(['price' => 90000]);
    Book::factory()->create(['price' => 15000]);

    get(route('catalog.index', ['sort' => 'price_asc']))->assertInertia(
        fn (Assert $page) => $page->where('books.data.0.price', 15000)
    );
});

it('filters by condition', function () {
    Book::factory()->create(['condition' => 'like_new']);
    Book::factory()->create(['condition' => 'poor']);

    get(route('catalog.index', ['condition' => 'like_new']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
    );
});

it('searches by title and author', function () {
    Book::factory()->create(['title' => 'Negeri 5 Menara', 'author' => 'Fuadi']);
    Book::factory()->create(['title' => 'Sang Pemimpi', 'author' => 'Hirata']);

    get(route('catalog.index', ['search' => 'menara']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
    );

    get(route('catalog.index', ['search' => 'hirata']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
    );
});

it('filters by price range', function () {
    Book::factory()->create(['price' => 20000]);
    Book::factory()->create(['price' => 80000]);

    get(route('catalog.index', ['min_price' => 50000]))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
    );
});

it('shows an available book detail', function () {
    $book = Book::factory()->create(['status' => 'available']);

    get(route('catalog.show', $book))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page->component('catalog/show')
                ->where('book.id', $book->id)
        );
});

it('hides a sold book detail', function () {
    $book = Book::factory()->sold()->create();

    get(route('catalog.show', $book))->assertNotFound();
});

it('filters by tag slug', function () {
    $tag = Tag::factory()->create(['slug' => 'langka']);
    $tagged = Book::factory()->create();
    $tagged->tags()->attach($tag);
    Book::factory()->create();

    get(route('catalog.index', ['tag' => 'langka']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
    );
});

it('searches full-text across description and isbn', function () {
    Book::factory()->create([
        'title' => 'Alfa',
        'author' => 'Penulis Satu',
        'description' => 'Kisah astronaut menjelajah galaksi.',
        'isbn' => null,
    ]);
    Book::factory()->create([
        'title' => 'Beta',
        'author' => 'Penulis Dua',
        'description' => 'Resep masakan nusantara.',
        'isbn' => '9789790000001',
    ]);

    get(route('catalog.index', ['search' => 'astronaut']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
            ->where('books.data.0.title', 'Alfa')
    );

    get(route('catalog.index', ['search' => '9789790000001']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
            ->where('books.data.0.title', 'Beta')
    );
});

it('matches search by word prefix', function () {
    Book::factory()->create(['title' => 'Petualangan Sherina', 'author' => 'Mira']);
    Book::factory()->create(['title' => 'Bumi Manusia', 'author' => 'Pram']);

    get(route('catalog.index', ['search' => 'petual']))->assertInertia(
        fn (Assert $page) => $page->has('books.data', 1)
            ->where('books.data.0.title', 'Petualangan Sherina')
    );
});
