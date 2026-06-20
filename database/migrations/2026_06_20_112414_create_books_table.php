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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('author')->nullable();
            $table->string('isbn')->nullable();
            $table->text('description')->nullable();
            $table->enum('condition', ['new', 'like_new', 'good', 'fair', 'poor']);
            $table->boolean('is_new')->default(false);
            $table->unsignedBigInteger('price');
            $table->unsignedBigInteger('cost_price')->nullable();
            $table->enum('status', ['available', 'reserved', 'sold'])->default('available')->index();
            $table->foreignId('category_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->enum('language', ['id', 'en', 'lainnya'])->default('id');
            $table->enum('audience', ['anak', 'remaja', 'dewasa', 'umum'])->default('umum');
            $table->timestamp('sold_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
