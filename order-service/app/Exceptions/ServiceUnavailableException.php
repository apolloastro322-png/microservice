<?php

// app/Exceptions/ServiceUnavailableException.php
// Dilempar oleh CartClient/ProductClient kalau service lain tidak bisa dihubungi.
// Controller nanti mengubahnya menjadi response 503.

namespace App\Exceptions;

use RuntimeException;
use Throwable;

class ServiceUnavailableException extends RuntimeException
{
    public function __construct(string $service, ?Throwable $previous = null)
    {
        parent::__construct("{$service} tidak dapat dihubungi, coba lagi nanti", 0, $previous);
    }
}
