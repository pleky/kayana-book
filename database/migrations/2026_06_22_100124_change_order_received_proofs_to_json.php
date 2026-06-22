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
            $table->dropColumn('received_proof_path');
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->json('received_proof_paths')->nullable()->after('received_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn('received_proof_paths');
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('received_proof_path')->nullable()->after('received_at');
        });
    }
};
