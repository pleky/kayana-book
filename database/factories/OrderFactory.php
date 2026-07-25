<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(20000, 200000);

        return [
            'user_id' => User::factory(),
            'status' => 'pending',
            'channel' => 'online',
            'subtotal' => $subtotal,
            'shipping_cost' => 0,
            'total' => $subtotal,
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->numerify('08##########'),
            'fulfillment' => 'pickup',
            'shipping_address' => null,
            'payment_method' => 'transfer',
            'expires_at' => now()->addDay(),
            'paid_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'paid',
            'paid_at' => now(),
            'expires_at' => null,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'pending',
            'expires_at' => now()->subHour(),
        ]);
    }
}
