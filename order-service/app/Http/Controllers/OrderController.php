<?php

// app/Http/Controllers/OrderController.php
// Lapisan controller: menerima request, memanggil service, membentuk response JSON,
// dan menangkap error lewat try catch. Tidak ada query atau aturan bisnis di sini.

namespace App\Http\Controllers;

use App\Exceptions\EmptyCartException;
use App\Exceptions\OrderNotFoundException;
use App\Exceptions\OrderNotPayableException;
use App\Exceptions\ProductUnavailableException;
use App\Exceptions\ServiceUnavailableException;
use App\Http\Requests\ListOrdersRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderController extends Controller
{
    // OrderService disuntikkan otomatis oleh Laravel (dependency injection).
    public function __construct(private OrderService $orderService)
    {
    }

    // POST /orders (validasi sudah dijalankan oleh StoreOrderRequest)
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $userId = (int) $request->validated()['user_id'];

        try {
            $order = $this->orderService->checkout($userId);

            return response()->json([
                'message' => 'Pesanan berhasil dibuat',
                'data' => $order,
            ], 201);
        } catch (EmptyCartException | ProductUnavailableException $e) {
            // Error yang sudah kita duga dari bisnis checkout: balas 409.
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (ServiceUnavailableException $e) {
            Log::error('Gagal membuat pesanan: service lain tidak dapat dihubungi', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 503);
        } catch (Throwable $e) {
            Log::error('Gagal membuat pesanan', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membuat pesanan'], 500);
        }
    }

    // GET /orders/{id}
    public function show(int $id): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Berhasil mengambil pesanan',
                'data' => $this->orderService->find($id),
            ], 200);
        } catch (OrderNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil pesanan', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal mengambil pesanan'], 500);
        }
    }

    // GET /orders/user/{userId}?status= (validasi filter oleh ListOrdersRequest)
    public function index(ListOrdersRequest $request, int $userId): JsonResponse
    {
        $status = $request->validated()['status'] ?? null;

        try {
            return response()->json([
                'message' => 'Berhasil mengambil daftar pesanan',
                'data' => $this->orderService->listByUser($userId, $status),
            ], 200);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil daftar pesanan', [
                'user_id' => $userId,
                'status' => $status,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal mengambil daftar pesanan'], 500);
        }
    }

    // PATCH /orders/{id}/pay
    public function pay(int $id): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Pesanan berhasil dibayar',
                'data' => $this->orderService->pay($id),
            ], 200);
        } catch (OrderNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        } catch (OrderNotPayableException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (Throwable $e) {
            Log::error('Gagal membayar pesanan', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membayar pesanan'], 500);
        }
    }
}
