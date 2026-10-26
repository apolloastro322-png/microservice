<?php

// app/Http/Requests/ListOrdersRequest.php
// Validasi filter ?status= pada GET /orders/user/{userId}.
// Status hanya PENDING atau PAID; selain itu ApiFormRequest membalas 422.

namespace App\Http\Requests;

class ListOrdersRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'status' => 'sometimes|in:PENDING,PAID',
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status harus PENDING atau PAID',
        ];
    }
}
