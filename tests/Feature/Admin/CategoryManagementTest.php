<?php

use App\Models\Book;
use App\Models\Category;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

function categoryAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('blocks non-admins from managing categories', function () {
    actingAs(User::factory()->create(['is_admin' => false]));

    get(route('admin.categories.index'))->assertForbidden();
});

it('creates a root category with a unique slug', function () {
    actingAs(categoryAdmin());

    post(route('admin.categories.store'), ['name' => 'Novel'])->assertRedirect();

    expect(Category::where('slug', 'novel')->exists())->toBeTrue();
});

it('creates a sub-category under a root', function () {
    actingAs(categoryAdmin());
    $root = Category::factory()->create(['parent_id' => null]);

    post(route('admin.categories.store'), [
        'name' => 'Manga',
        'parent_id' => $root->id,
    ])->assertRedirect();

    expect(Category::where('slug', 'manga')->value('parent_id'))->toBe($root->id);
});

it('rejects nesting deeper than two levels', function () {
    actingAs(categoryAdmin());
    $root = Category::factory()->create(['parent_id' => null]);
    $child = Category::factory()->create(['parent_id' => $root->id]);

    post(route('admin.categories.store'), [
        'name' => 'Terlalu Dalam',
        'parent_id' => $child->id,
    ])->assertSessionHasErrors('parent_id');
});

it('prevents a category with children from becoming a sub-category', function () {
    actingAs(categoryAdmin());
    $root = Category::factory()->create(['parent_id' => null]);
    Category::factory()->create(['parent_id' => $root->id]);
    $other = Category::factory()->create(['parent_id' => null]);

    put(route('admin.categories.update', $root), [
        'name' => $root->name,
        'parent_id' => $other->id,
    ])->assertSessionHasErrors('parent_id');
});

it('detaches books when a category is deleted', function () {
    actingAs(categoryAdmin());
    $category = Category::factory()->create();
    $book = Book::factory()->create(['category_id' => $category->id]);

    delete(route('admin.categories.destroy', $category))->assertRedirect();

    expect(Category::count())->toBe(0)
        ->and($book->refresh()->category_id)->toBeNull();
});
