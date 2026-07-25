<?php

use App\Models\Book;
use App\Models\BookImage;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\patch;

function imageAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('deletes an image, removes the file, and promotes a new primary', function () {
    Storage::fake('public');
    actingAs(imageAdmin());

    $book = Book::factory()->create();
    $primary = BookImage::factory()->primary()->create([
        'book_id' => $book->id,
        'path' => 'books/primary.jpg',
        'sort_order' => 1,
    ]);
    $secondary = BookImage::factory()->create([
        'book_id' => $book->id,
        'path' => 'books/secondary.jpg',
        'sort_order' => 2,
    ]);
    Storage::disk('public')->put($primary->path, 'x');

    delete(route('admin.books.images.destroy', [$book, $primary]))
        ->assertRedirect();

    Storage::disk('public')->assertMissing('books/primary.jpg');
    expect(BookImage::find($primary->id))->toBeNull()
        ->and($secondary->refresh()->is_primary)->toBeTrue();
});

it('sets a different image as primary', function () {
    actingAs(imageAdmin());

    $book = Book::factory()->create();
    $a = BookImage::factory()->primary()->create(['book_id' => $book->id]);
    $b = BookImage::factory()->create(['book_id' => $book->id]);

    patch(route('admin.books.images.primary', [$book, $b]))->assertRedirect();

    expect($a->refresh()->is_primary)->toBeFalse()
        ->and($b->refresh()->is_primary)->toBeTrue();
});

it('refuses to touch an image from another book', function () {
    actingAs(imageAdmin());

    $book = Book::factory()->create();
    $otherImage = BookImage::factory()->create();

    delete(route('admin.books.images.destroy', [$book, $otherImage]))
        ->assertNotFound();
});
