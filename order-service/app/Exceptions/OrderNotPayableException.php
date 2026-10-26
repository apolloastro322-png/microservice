<?php

// app/Exceptions/OrderNotPayableException.php
// Dilempar saat pesanan yang mau dibayar statusnya bukan PENDING (mis. sudah PAID).
// Controller mengubahnya menjadi response 409.

namespace App\Exceptions;

use RuntimeException;

class OrderNotPayableException extends RuntimeException
{
    public function __construct(string $status)
    {
        parent::__construct("Pesanan berstatus {$status}, hanya pesanan PENDING yang dapat dibayar");
    }
}
