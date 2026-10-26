<?php

// app/Exceptions/ProductUnavailableException.php
// Dilempar saat checkout kalau produk tidak ditemukan atau stoknya kurang.
// Controller nanti mengubahnya menjadi response 409.

namespace App\Exceptions;

use RuntimeException;

class ProductUnavailableException extends RuntimeException
{
    public function __construct(string $message)
    {
        parent::__construct($message);
    }
}
