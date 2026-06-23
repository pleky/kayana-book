<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE books SET condition = 'like_new' WHERE condition = 'new'");
        DB::statement('ALTER TABLE books DROP CONSTRAINT books_condition_check');
        DB::statement("ALTER TABLE books ADD CONSTRAINT books_condition_check CHECK (condition IN ('like_new', 'good', 'fair', 'poor'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE books DROP CONSTRAINT books_condition_check');
        DB::statement("ALTER TABLE books ADD CONSTRAINT books_condition_check CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor'))");
    }
};
