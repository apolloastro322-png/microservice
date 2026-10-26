<?php

// app/Exceptions/EmptyCartException.php
// Dilempar saat checkout kalau keranjang user tidak berisi item.
// Controller nanti mengubahnya menjadi response 409.

namespace App\Exceptions;

use RuntimeException;

class EmptyCartException extends RuntimeException
{
    public function __construct(int $userId)
    {
        parent::__construct("Keranjang user {$userId} kosong");
    }
}
