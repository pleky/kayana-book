<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkout_links', function (Blueprint $table): void {
            $table->id();
            $table->string('label')->nullable();
            $table->string('token')->unique();
            $table->string('status')->default('active'); // active | revoked
            $table->string('shipping_mode')->default('pickup'); // admin_set | pickup
            $table->unsignedInteger('shipping_cost')->default(0);
            $table->unsignedInteger('weight_grams')->nullable();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->text('shipping_address')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkout_links');
    }
};
