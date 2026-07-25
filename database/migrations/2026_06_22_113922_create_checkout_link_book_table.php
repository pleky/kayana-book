<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkout_link_book', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('checkout_link_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->unique(['checkout_link_id', 'book_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkout_link_book');
    }
};
