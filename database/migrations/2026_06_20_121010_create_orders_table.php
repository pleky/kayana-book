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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->enum('status', ['pending', 'paid', 'completed', 'cancelled'])->default('pending')->index();
            $table->enum('channel', ['online', 'offline'])->default('online');
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('shipping_cost')->default(0);
            $table->unsignedBigInteger('total');
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->enum('fulfillment', ['pickup', 'ship']);
            $table->text('shipping_address')->nullable();
            $table->enum('payment_method', ['transfer', 'cash'])->default('transfer');
            $table->timestamp('expires_at')->nullable()->index();
            $table->string('cancel_reason')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
