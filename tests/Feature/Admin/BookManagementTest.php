<?php

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

function admin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('redirects guests away from admin books', function () {
    get(route('admin.books.index'))->assertRedirect(route('login'));
});

it('forbids non-admin users', function () {
    actingAs(User::factory()->create(['is_admin' => false]));

    get(route('admin.books.index'))->assertForbidden();
});

it('lets an admin view the book list', function () {
    actingAs(admin());

    get(route('admin.books.index'))->assertOk();
});

it('creates a book with an uploaded photo', function () {
    Storage::fake('public');
    actingAs(admin());

    post(route('admin.books.store'), [
        'title' => 'Laskar Pelangi',
        'price' => 45000,
        'condition' => 'good',
        'language' => 'id',
        'audience' => 'umum',
        'photos' => [UploadedFile::fake()->image('cover.jpg')],
    ])->assertRedirect();

    $book = Book::firstOrFail();

    expect($book->title)->toBe('Laskar Pelangi')
        ->and($book->slug)->toBe('laskar-pelangi')
        ->and($book->status)->toBe('available')
        ->and($book->images)->toHaveCount(1)
        ->and($book->images->first()->is_primary)->toBeTrue();

    Storage::disk('public')->assertExists($book->images->first()->path);
});

it('requires title, price and at least one photo', function () {
    actingAs(admin());

    post(route('admin.books.store'), [
        'condition' => 'good',
        'language' => 'id',
        'audience' => 'umum',
    ])->assertSessionHasErrors(['title', 'price', 'photos']);
});

it('generates unique slugs for duplicate titles', function () {
    Storage::fake('public');
    actingAs(admin());

    $payload = fn () => [
        'title' => 'Bumi Manusia',
        'price' => 50000,
        'condition' => 'good',
        'language' => 'id',
        'audience' => 'umum',
        'photos' => [UploadedFile::fake()->image('c.jpg')],
    ];

    post(route('admin.books.store'), $payload());
    post(route('admin.books.store'), $payload());

    expect(Book::pluck('slug')->all())->toBe(['bumi-manusia', 'bumi-manusia-2']);
});

it('marks the book sold and stamps sold_at on update', function () {
    actingAs(admin());
    $book = Book::factory()->create(['status' => 'available', 'sold_at' => null]);

    put(route('admin.books.update', $book), [
        'title' => $book->title,
        'price' => $book->price,
        'condition' => $book->condition,
        'language' => $book->language,
        'audience' => $book->audience,
        'status' => 'sold',
    ])->assertRedirect();

    $book->refresh();

    expect($book->status)->toBe('sold')
        ->and($book->sold_at)->not->toBeNull();
});

it('assigns a category on update', function () {
    actingAs(admin());
    $book = Book::factory()->create();
    $category = Category::factory()->create();

    put(route('admin.books.update', $book), [
        'title' => $book->title,
        'price' => $book->price,
        'condition' => $book->condition,
        'language' => $book->language,
        'audience' => $book->audience,
        'status' => 'available',
        'category_id' => $category->id,
    ])->assertRedirect();

    expect($book->refresh()->category_id)->toBe($category->id);
});

it('soft deletes a book', function () {
    actingAs(admin());
    $book = Book::factory()->create();

    delete(route('admin.books.destroy', $book))->assertRedirect();

    expect(Book::count())->toBe(0)
        ->and(Book::withTrashed()->count())->toBe(1);
});
