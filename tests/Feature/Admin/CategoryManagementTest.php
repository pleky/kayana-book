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

it('reorders categories by persisting sort_order from the given id order', function () {
    actingAs(categoryAdmin());
    $a = Category::factory()->create(['sort_order' => 0]);
    $b = Category::factory()->create(['sort_order' => 1]);
    $c = Category::factory()->create(['sort_order' => 2]);

    post(route('admin.categories.reorder'), ['ids' => [$c->id, $a->id, $b->id]])
        ->assertRedirect();

    expect($c->refresh()->sort_order)->toBe(0)
        ->and($a->refresh()->sort_order)->toBe(1)
        ->and($b->refresh()->sort_order)->toBe(2);
});

it('blocks non-admins from reordering categories', function () {
    actingAs(User::factory()->create(['is_admin' => false]));

    post(route('admin.categories.reorder'), ['ids' => [1]])->assertForbidden();
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
