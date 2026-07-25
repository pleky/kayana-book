<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add a Postgres full-text search column derived from the book's text
     * fields, kept in sync automatically as a stored generated column and
     * indexed with GIN for fast `@@` matching.
     */
    public function up(): void
    {
        DB::statement(<<<'SQL'
            ALTER TABLE books ADD COLUMN searchable tsvector
            GENERATED ALWAYS AS (
                to_tsvector('simple',
                    coalesce(title, '') || ' ' ||
                    coalesce(author, '') || ' ' ||
                    coalesce(description, '') || ' ' ||
                    coalesce(isbn, '')
                )
            ) STORED
        SQL);

        DB::statement('CREATE INDEX books_searchable_idx ON books USING gin(searchable)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS books_searchable_idx');
        DB::statement('ALTER TABLE books DROP COLUMN IF EXISTS searchable');
    }
};
