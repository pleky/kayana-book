<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown during checkout when a book in the cart was reserved or sold by
 * someone else before this customer committed (ARCHITECTURE §4.1).
 */
class CartConflictException extends RuntimeException
{
    public function __construct(public readonly string $bookTitle)
    {
        parent::__construct("Buku \"{$bookTitle}\" sudah laku, keburu diambil orang lain.");
    }
}
