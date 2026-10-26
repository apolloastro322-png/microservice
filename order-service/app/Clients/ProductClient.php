<?php

// app/Clients/ProductClient.php
// Satu-satunya tempat order-service memanggil product-service.
// Kegagalan jaringan/5xx menjadi ServiceUnavailableException (503),
// sedangkan produk tidak ditemukan (404) dikembalikan sebagai null (kasus bisnis).

namespace App\Clients;

use App\Exceptions\ServiceUnavailableException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductClient
{
    // GET /products/{id} -> data produk, atau null kalau produk tidak ada.
    public function get(int $productId): ?array
    {
        $baseUrl = config('services.product.url');
        $url = rtrim($baseUrl, '/')."/products/{$productId}";

        try {
            $response = Http::baseUrl($baseUrl)
                ->acceptJson()
                ->timeout(config('services.timeout'))
                ->get("/products/{$productId}");
        } catch (Throwable $e) {
            $this->gagal($productId, $url, $e->getMessage(), $e);
        }

        if ($response->status() === 404) {
            Log::warning('Produk tidak ditemukan di product-service', [
                'product_id' => $productId,
            ]);

            return null;
        }

        if (! $response->successful()) {
            $this->gagal($productId, $url, "HTTP {$response->status()}");
        }

        // Sukses tapi tanpa data berarti kontrak API dilanggar, jangan diamkan.
        if (! is_array($response->json('data'))) {
            $this->gagal($productId, $url, 'Response 200 tanpa data produk');
        }

        return $response->json('data');
    }

    // Catat penyebabnya lalu lempar 503; $previous menjaga jejak error aslinya.
    private function gagal(int $productId, string $url, string $error, ?Throwable $previous = null): never
    {
        Log::error('Gagal mengambil produk dari product-service', [
            'product_id' => $productId,
            'url' => $url,
            'error' => $error,
        ]);

        throw new ServiceUnavailableException('Product service', $previous);
    }
}
