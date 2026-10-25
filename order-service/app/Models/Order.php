<?php

// app/Models/Order.php
// Lapisan model: tabel orders dan relasi ke item. Logika bisnis ada di OrderService.

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    // Kolom yang boleh diisi massal, pengaman mass assignment.
    protected $fillable = ['user_id', 'status', 'total_amount'];

    // Satu order punya banyak item. Relasi dipakai untuk with('items') saat checkout.
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // Uang disimpan decimal, dibaca sebagai float supaya JSON jadi angka.
    protected function casts(): array
    {
        return [
            'total_amount' => 'float',
        ];
    }
}
