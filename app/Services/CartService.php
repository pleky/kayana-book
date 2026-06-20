<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Session\Store;

/**
 * Session-backed cart (ADR-007). Holds unique book ids only; adding does NOT
 * reserve stock — reservation happens atomically at checkout (ARCHITECTURE
 * §4.1), so two customers may hold the same book until one checks out first.
 */
class CartService
{
    private const KEY = 'cart';

    public function __construct(private readonly Store $session) {}

    /**
     * @return list<int>
     */
    public function ids(): array
    {
        return array_values(array_unique($this->session->get(self::KEY, [])));
    }

    public function add(Book $book): void
    {
        $ids = $this->ids();

        if (! in_array($book->id, $ids, true)) {
            $ids[] = $book->id;
            $this->session->put(self::KEY, $ids);
        }
    }

    public function remove(Book $book): void
    {
        $this->session->put(
            self::KEY,
            array_values(array_filter($this->ids(), fn (int $id): bool => $id !== $book->id)),
        );
    }

    public function clear(): void
    {
        $this->session->forget(self::KEY);
    }

    public function has(Book $book): bool
    {
        return in_array($book->id, $this->ids(), true);
    }

    /**
     * Books still in the cart that remain purchasable. Drops any that became
     * reserved/sold so the cart self-heals.
     *
     * @return Collection<int, Book>
     */
    public function availableBooks(): Collection
    {
        $ids = $this->ids();

        if ($ids === []) {
            return new Collection;
        }

        return Book::query()
            ->available()
            ->with('primaryImage')
            ->whereIn('id', $ids)
            ->get();
    }

    public function count(): int
    {
        return count($this->ids());
    }

    public function subtotal(): int
    {
        return (int) $this->availableBooks()->sum('price');
    }
}
