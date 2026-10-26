<?php

// routes/api.php
// Hanya memetakan method dan path ke handler, tanpa logika apapun.

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'service' => 'order-service',
]));

Route::post('/orders', [OrderController::class, 'store']);

// /orders/user/{userId} harus didahulukan sebelum /orders/{id}.
Route::get('/orders/user/{userId}', [OrderController::class, 'index'])->whereNumber('userId');
Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');
Route::patch('/orders/{id}/pay', [OrderController::class, 'pay'])->whereNumber('id');
