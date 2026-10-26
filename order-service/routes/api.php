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
