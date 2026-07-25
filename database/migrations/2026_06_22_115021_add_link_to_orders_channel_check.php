<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE orders DROP CONSTRAINT orders_channel_check');
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_channel_check CHECK (channel IN ('online', 'offline', 'link'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE orders DROP CONSTRAINT orders_channel_check');
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_channel_check CHECK (channel IN ('online', 'offline'))");
    }
};
