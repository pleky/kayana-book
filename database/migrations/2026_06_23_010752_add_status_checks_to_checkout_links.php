<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE checkout_links ADD CONSTRAINT checkout_links_status_check CHECK (status IN ('active', 'revoked'))");
        DB::statement("ALTER TABLE checkout_links ADD CONSTRAINT checkout_links_shipping_mode_check CHECK (shipping_mode IN ('admin_set', 'pickup'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE checkout_links DROP CONSTRAINT checkout_links_status_check');
        DB::statement('ALTER TABLE checkout_links DROP CONSTRAINT checkout_links_shipping_mode_check');
    }
};
