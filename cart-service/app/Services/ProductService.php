<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductService
{
    public function getProduct(int $productId): ?array
    {
        try {
            $response = Http::baseUrl(config('services.product.url'))->get("/products/{$productId}");

            if ($response->successful() && isset($response->json()['data'])) {
                return $response->json()['data'];
            }

            return null;
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data product', [
                'product_id' => $productId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}