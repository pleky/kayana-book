<?php

use App\Models\Book;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

function tagAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('creates tags from a comma-separated list when storing a book', function () {
    Storage::fake('public');
    actingAs(tagAdmin());

    post(route('admin.books.store'), [
        'title' => 'Bumi Manusia',
        'price' => 60000,
        'condition' => 'good',
        'language' => 'id',
        'audience' => 'umum',
        'tags' => 'Langka, Edisi Pertama',
        'photos' => [UploadedFile::fake()->image('cover.jpg')],
    ])->assertRedirect();

    $book = Book::firstOrFail();

    expect($book->tags->pluck('name')->all())
        ->toEqualCanonicalizing(['Langka', 'Edisi Pertama']);
    expect(Tag::count())->toBe(2);
});

it('reuses existing tags instead of duplicating them', function () {
    Storage::fake('public');
    actingAs(tagAdmin());
    Tag::factory()->create(['name' => 'Langka', 'slug' => 'langka']);

    post(route('admin.books.store'), [
        'title' => 'Sang Pemimpi',
        'price' => 40000,
        'condition' => 'good',
        'language' => 'id',
        'audience' => 'umum',
        'tags' => 'langka',
        'photos' => [UploadedFile::fake()->image('cover.jpg')],
    ])->assertRedirect();

    expect(Tag::count())->toBe(1);
    expect(Book::firstOrFail()->tags)->toHaveCount(1);
});

it('replaces tags when updating a book', function () {
    actingAs(tagAdmin());

    $book = Book::factory()->create();
    $book->tags()->attach(Tag::factory()->create(['name' => 'Lama', 'slug' => 'lama']));

    put(route('admin.books.update', $book), [
        'title' => $book->title,
        'price' => $book->price,
        'condition' => $book->condition,
        'language' => $book->language,
        'audience' => $book->audience,
        'status' => 'available',
        'tags' => 'Baru',
    ])->assertRedirect();

    expect($book->refresh()->tags->pluck('name')->all())->toBe(['Baru']);
});

it('clears tags when the field is left empty on update', function () {
    actingAs(tagAdmin());

    $book = Book::factory()->create();
    $book->tags()->attach(Tag::factory()->create(['slug' => 'lama']));

    put(route('admin.books.update', $book), [
        'title' => $book->title,
        'price' => $book->price,
        'condition' => $book->condition,
        'language' => $book->language,
        'audience' => $book->audience,
        'status' => 'available',
        'tags' => '',
    ])->assertRedirect();

    expect($book->refresh()->tags)->toHaveCount(0);
});
