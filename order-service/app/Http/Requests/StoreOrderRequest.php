<?php

// app/Http/Requests/StoreOrderRequest.php
// Aturan validasi untuk POST /orders, dijalankan Laravel sebelum controller dipanggil.
// Kalau gagal, ApiFormRequest membalas 422 dan controller tidak sempat jalan.

namespace App\Http\Requests;

class StoreOrderRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'user_id' => 'required|integer|min:1',
        ];
    }

    // Pesan kesalahan berbahasa Indonesia. Kunci berupa nama aturan, berlaku untuk semua field.
    public function messages(): array
    {
        return [
            'required' => 'Field :attribute wajib diisi',
            'integer' => 'Field :attribute harus berupa angka bulat',
            'min' => 'Field :attribute minimal bernilai :min',
        ];
    }
}
