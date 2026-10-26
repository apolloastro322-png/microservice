<?php

// app/Clients/CartClient.php
// Satu-satunya tempat order-service memanggil cart-service.
// Kegagalan apa pun menjadi ServiceUnavailableException (503);
// keranjang yang belum ada dianggap kosong, bukan error.

namespace App\Clients;

use App\Exceptions\ServiceUnavailableException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class CartClient
{
    // GET /carts/{userId} -> data keranjang (items, total_quantity).
    public function get(int $userId): array
    {
        $baseUrl = config('services.cart.url');
        $url = rtrim($baseUrl, '/')."/carts/{$userId}";

        try {
            $response = Http::baseUrl($baseUrl)
                ->acceptJson()
                ->timeout(config('services.timeout'))
                ->get("/carts/{$userId}");
        } catch (Throwable $e) {
            $this->gagal($userId, $url, $e->getMessage(), $e);
        }

        // Keranjang belum ada = kosong. Nanti service yang memutuskan 409.
        if ($response->status() === 404) {
            return ['user_id' => $userId, 'items' => [], 'total_quantity' => 0];
        }

        if (! $response->successful()) {
            $this->gagal($userId, $url, "HTTP {$response->status()}");
        }

        if (! is_array($response->json('data'))) {
            $this->gagal($userId, $url, 'Response 200 tanpa data keranjang');
        }

        return $response->json('data');
    }

    // DELETE /carts/{userId}. Gagal di sini ditangani OrderService sebagai warning.
    public function clear(int $userId): void
    {
        $baseUrl = config('services.cart.url');
        $url = rtrim($baseUrl, '/')."/carts/{$userId}";

        try {
            $response = Http::baseUrl($baseUrl)
                ->acceptJson()
                ->timeout(config('services.timeout'))
                ->delete("/carts/{$userId}");
        } catch (Throwable $e) {
            $this->gagal($userId, $url, $e->getMessage(), $e);
        }

        if (! $response->successful()) {
            $this->gagal($userId, $url, "HTTP {$response->status()}");
        }
    }

    // Catat penyebabnya lalu lempar 503; $previous menjaga jejak error aslinya.
    private function gagal(int $userId, string $url, string $error, ?Throwable $previous = null): never
    {
        Log::error('Gagal menghubungi cart-service', [
            'user_id' => $userId,
            'url' => $url,
            'error' => $error,
        ]);

        throw new ServiceUnavailableException('Cart service', $previous);
    }
}
