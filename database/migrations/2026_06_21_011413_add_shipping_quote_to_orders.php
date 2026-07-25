<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot the chosen RajaOngkir quote (courier / service / ETD / weight)
     * onto the order at checkout (Phase B). Cost itself reuses `shipping_cost`.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_courier')->nullable()->after('shipping_destination_label');
            $table->string('shipping_service')->nullable()->after('shipping_courier');
            $table->string('shipping_etd')->nullable()->after('shipping_service');
            $table->unsignedInteger('shipping_weight_grams')->nullable()->after('shipping_etd');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_courier',
                'shipping_service',
                'shipping_etd',
                'shipping_weight_grams',
            ]);
        });
    }
};
