<?php

// app/Services/OrderService.php
// Logika checkout: validasi keranjang & stok lewat HTTP dulu, lalu simpan
// snapshot pesanan dalam satu transaksi. Tanpa HTTP di dalam transaksi.

namespace App\Services;

use App\Clients\CartClient;
use App\Clients\ProductClient;
use App\Exceptions\EmptyCartException;
use App\Exceptions\ProductUnavailableException;
use App\Exceptions\ServiceUnavailableException;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderService
{
    public function __construct(
        private readonly CartClient $cartClient,
        private readonly ProductClient $productClient,
    ) {}

    public function checkout(int $userId): Order
    {
        $cart = $this->cartClient->get($userId);

        if (count($cart['items']) === 0) {
            throw new EmptyCartException($userId);
        }

        $rows = [];
        $total = 0.0;

        // Semua item divalidasi dulu supaya tidak ada pesanan setengah jadi.
        foreach ($cart['items'] as $item) {
            $productId = (int) $item['product_id'];
            $quantity = (int) $item['quantity'];
            $product = $this->productClient->get($productId);

            if ($product === null) {
                throw new ProductUnavailableException("Produk dengan id {$productId} tidak ditemukan");
            }

            if ((int) $product['stock'] < $quantity) {
                throw new ProductUnavailableException(
                    "Stok {$product['name']} tidak mencukupi: diminta {$quantity}, tersedia {$product['stock']}"
                );
            }

            // Harga dari product-service berupa string, mis. "500000.00".
            $unitPrice = (float) $product['price'];
            $subtotal = round($unitPrice * $quantity, 2);

            $rows[] = [
                'product_id' => $productId,
                'product_name' => $product['name'],
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
            ];

            $total = round($total + $subtotal, 2);
        }

        $order = DB::transaction(function () use ($userId, $total, $rows) {
            $order = Order::create([
                'user_id' => $userId,
                'status' => 'PENDING',
                'total_amount' => $total,
            ]);

            $order->items()->createMany($rows);

            return $order;
        });

        // Pesanan sudah commit: gagal kosongkan keranjang cukup dicatat, tidak dibatalkan.
        try {
            $this->cartClient->clear($userId);
        } catch (ServiceUnavailableException $e) {
            Log::warning('Gagal mengosongkan keranjang setelah pesanan dibuat', [
                'user_id' => $userId,
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $order->load('items');
    }
}
