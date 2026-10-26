<?php

// app/Exceptions/OrderNotFoundException.php
// Dilempar saat pesanan dengan id tertentu tidak ada.
// Controller nanti mengubahnya menjadi response 404.

namespace App\Exceptions;

use RuntimeException;

class OrderNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Pesanan dengan id {$id} tidak ditemukan");
    }
}
