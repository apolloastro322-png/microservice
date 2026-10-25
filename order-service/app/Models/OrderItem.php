<?php

// app/Models/OrderItem.php
// Lapisan model: tabel order_items, snapshot produk saat checkout. Tanpa logika bisnis.

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    // Kolom yang boleh diisi massal, pengaman mass assignment.
    protected $fillable = ['order_id', 'product_id', 'product_name', 'unit_price', 'quantity', 'subtotal'];

    // Setiap item milik satu order.
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // Uang disimpan decimal, dibaca sebagai float supaya JSON jadi angka.
    protected function casts(): array
    {
        return [
            'unit_price' => 'float',
            'subtotal' => 'float',
        ];
    }
}
