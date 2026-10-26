<?php

// app/Http/Requests/ApiFormRequest.php
// Dasar Form Request untuk API: validasi gagal selalu dibalas 422 dengan bentuk
// {message, errors} yang sama, bukan redirect/HTML bawaan Laravel.

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class ApiFormRequest extends FormRequest
{
    // Belum ada autentikasi di service ini, jadi semua request diizinkan.
    public function authorize(): bool
    {
        return true;
    }

    // Ganti perilaku bawaan (redirect + flash error) dengan response JSON.
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Data yang dikirim tidak valid',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
