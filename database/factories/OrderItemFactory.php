<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $book = Book::factory();

        return [
            'order_id' => Order::factory(),
            'book_id' => $book,
            'title' => fake()->sentence(3),
            'price' => fake()->numberBetween(20000, 200000),
        ];
    }
}
