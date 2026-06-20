<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1, 1000000),
            'author' => fake()->name(),
            'isbn' => fake()->optional()->isbn13(),
            'description' => fake()->optional()->paragraph(),
            'condition' => fake()->randomElement(['new', 'like_new', 'good', 'fair', 'poor']),
            'is_new' => false,
            'price' => fake()->numberBetween(10000, 200000),
            'cost_price' => fake()->optional()->numberBetween(5000, 100000),
            'status' => 'available',
            'category_id' => null,
            'language' => fake()->randomElement(['id', 'en', 'lainnya']),
            'audience' => fake()->randomElement(['anak', 'remaja', 'dewasa', 'umum']),
            'sold_at' => null,
        ];
    }

    public function sold(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'sold',
            'sold_at' => now(),
        ]);
    }

    public function reserved(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'reserved',
        ]);
    }
}
