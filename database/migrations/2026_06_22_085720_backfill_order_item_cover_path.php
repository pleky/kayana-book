<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill cover snapshots for order items created before the cover_path
     * column existed, pulling each book's primary image.
     */
    public function up(): void
    {
        DB::statement(<<<'SQL'
            UPDATE order_items
            SET cover_path = (
                SELECT path FROM book_images
                WHERE book_images.book_id = order_items.book_id
                  AND book_images.is_primary = true
                LIMIT 1
            )
            WHERE cover_path IS NULL AND book_id IS NOT NULL
        SQL);
    }

    public function down(): void
    {
        //
    }
};
