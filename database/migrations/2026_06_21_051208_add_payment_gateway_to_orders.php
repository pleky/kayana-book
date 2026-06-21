<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('payment_gateway')->nullable()->after('payment_method');
            $table->string('payment_reference')->nullable()->index()->after('payment_gateway');
            $table->string('payment_channel')->nullable()->after('payment_reference');
            $table->text('snap_token')->nullable()->after('payment_channel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['payment_gateway', 'payment_reference', 'payment_channel', 'snap_token']);
        });
    }
};
