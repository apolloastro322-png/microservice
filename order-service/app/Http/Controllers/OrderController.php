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
            // Penolakan bisnis: 409 dan cukup dicatat sebagai warning.
            Log::warning('Checkout ditolak', [
                'user_id' => $userId,
                'reason' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 409);
        } catch (ServiceUnavailableException $e) {
            return $this->errorResponse($e, 'membuat pesanan', 503, ['user_id' => $userId]);
        } catch (Throwable $e) {
            return $this->errorResponse($e, 'membuat pesanan', 500, ['user_id' => $userId]);
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
            // 404 adalah kondisi normal, tidak dicatat sebagai error/warning.
            return response()->json(['message' => $e->getMessage()], 404);
        } catch (Throwable $e) {
            return $this->errorResponse($e, 'mengambil pesanan', 500, ['id' => $id]);
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
            return $this->errorResponse($e, 'mengambil daftar pesanan', 500, [
                'user_id' => $userId,
                'status' => $status,
            ]);
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
            Log::warning('Pembayaran ditolak', [
                'order_id' => $id,
                'reason' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 409);
        } catch (Throwable $e) {
            return $this->errorResponse($e, 'membayar pesanan', 500, ['order_id' => $id]);
        }
    }

    // Format error 500/503 yang seragam. Detail teknis hanya ikut saat APP_DEBUG=true.
    private function errorResponse(Throwable $e, string $action, int $status, array $context = []): JsonResponse
    {
        Log::error("Gagal {$action}", array_merge($context, [
            'error' => $e->getMessage(),
            'exception' => $e::class,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]));

        // Pesan 503 berasal dari exception bisnis (service mana yang mati), jadi dipertahankan.
        $body = ['message' => $status === 503 ? $e->getMessage() : "Gagal {$action}"];

        if (config('app.debug') === true) {
            $body['error'] = $e->getMessage();
            $body['location'] = $e->getFile().':'.$e->getLine();
        }

        return response()->json($body, $status);
    }
}
