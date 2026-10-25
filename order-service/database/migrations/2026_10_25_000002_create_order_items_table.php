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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            // Item ikut terhapus bila order dihapus.
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            // product_id tanpa foreign key: produk milik product-service.
            $table->unsignedBigInteger('product_id');
            // Snapshot nama dan harga saat checkout, bukan data live.
            $table->string('product_name');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
