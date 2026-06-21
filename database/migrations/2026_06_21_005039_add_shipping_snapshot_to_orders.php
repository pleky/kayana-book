<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot shipping recipient + destination onto the order at checkout, so
     * history survives a user editing or deleting a saved address. Courier /
     * service / weight columns are added later in Phase B.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('recipient_name')->nullable()->after('customer_phone');
            $table->string('recipient_phone')->nullable()->after('recipient_name');
            $table->string('shipping_postal_code')->nullable()->after('shipping_address');
            $table->unsignedBigInteger('shipping_destination_id')->nullable()->after('shipping_postal_code');
            $table->string('shipping_destination_label')->nullable()->after('shipping_destination_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'recipient_name',
                'recipient_phone',
                'shipping_postal_code',
                'shipping_destination_id',
                'shipping_destination_label',
            ]);
        });
    }
};
