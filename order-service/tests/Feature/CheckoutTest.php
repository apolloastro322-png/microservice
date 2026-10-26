<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Tidak boleh ada request HTTP nyata selama test.
        Http::preventStrayRequests();

        config([
            'services.cart.url' => 'http://cart-service',
            'services.product.url' => 'http://product-service',
            'services.timeout' => 5,
        ]);
    }

    // GET /carts/{id} dan DELETE /carts/{id} punya URL sama, jadi fake wajib per method.
    private function fakeServices(
        array $products,
        array $cartItems = [],
        bool $cartGetFails = false,
        bool $clearFails = false,
    ): void {
        Http::fake(function (Request $request) use ($products, $cartItems, $cartGetFails, $clearFails) {
            $method = $request->method();
            $url = $request->url();

            if ($method === 'GET' && preg_match('#/products/(\d+)$#', $url, $m)) {
                $product = $products[(int) $m[1]] ?? null;

                if ($product === null) {
                    return Http::response(['message' => 'Produk tidak ditemukan'], 404);
                }

                // Penanda khusus untuk mensimulasikan product-service membalas 5xx.
                if (isset($product['http_status'])) {
                    return Http::response(['message' => 'Internal server error'], $product['http_status']);
                }

                return Http::response(['data' => $product], 200);
            }

            if ($method === 'GET' && preg_match('#/carts/(\d+)$#', $url, $m)) {
                if ($cartGetFails) {
                    return Http::response(['message' => 'Internal server error'], 500);
                }

                return Http::response([
                    'data' => [
                        'user_id' => (int) $m[1],
                        'items' => $cartItems,
                        'total_quantity' => array_sum(array_column($cartItems, 'quantity')),
                    ],
                ], 200);
            }

            if ($method === 'DELETE' && preg_match('#/carts/(\d+)$#', $url)) {
                if ($clearFails) {
                    return Http::response(['message' => 'Internal server error'], 500);
                }

                return Http::response(['data' => ['deleted_items' => count($cartItems)]], 200);
            }

            // Request di luar kontrak: gagalkan supaya test tidak lolos diam-diam.
            return Http::response(['message' => "Tidak di-fake: {$method} {$url}"], 500);
        });
    }

    // Data produk seed, harga dikirim sebagai string seperti product-service nyata.
    private function produkContoh(): array
    {
        return [
            1 => ['id' => 1, 'name' => 'Keyboard Mekanikal', 'price' => '500000.00', 'stock' => 25],
            2 => ['id' => 2, 'name' => 'Mouse Wireless', 'price' => '350000.00', 'stock' => 10],
        ];
    }

    public function test_checkout_sukses(): void
    {
        $this->fakeServices($this->produkContoh(), [
            ['product_id' => 1, 'quantity' => 2],
            ['product_id' => 2, 'quantity' => 1],
        ]);

        $response = $this->postJson('/orders', ['user_id' => 7]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Pesanan berhasil dibuat')
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.total_amount', 1350000)
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.product_name', 'Keyboard Mekanikal')
            ->assertJsonPath('data.items.0.unit_price', 500000)
            ->assertJsonPath('data.items.0.subtotal', 1000000)
            ->assertJsonPath('data.items.1.product_name', 'Mouse Wireless')
            ->assertJsonPath('data.items.1.unit_price', 350000)
            ->assertJsonPath('data.items.1.subtotal', 350000);

        $this->assertIsInt($response->json('data.id'));

        $this->assertDatabaseHas('orders', [
            'user_id' => 7,
            'status' => 'PENDING',
            'total_amount' => 1350000,
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => 1,
            'unit_price' => 500000,
            'subtotal' => 1000000,
        ]);

        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && str_contains($request->url(), '/carts/7'));
    }

    public function test_checkout_tanpa_user_id_ditolak_422(): void
    {
        $response = $this->postJson('/orders', []);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Data yang dikirim tidak valid')
            ->assertJsonStructure(['errors' => ['user_id']]);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_keranjang_kosong_409(): void
    {
        $this->fakeServices($this->produkContoh());

        $response = $this->postJson('/orders', ['user_id' => 7]);

        $response->assertStatus(409);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_stok_kurang_409_dan_tidak_menyimpan_order(): void
    {
        // Item pertama valid, item kedua gagal: membuktikan tidak ada order setengah jadi.
        $this->fakeServices($this->produkContoh(), [
            ['product_id' => 1, 'quantity' => 1],
            ['product_id' => 2, 'quantity' => 11],
        ]);

        $response = $this->postJson('/orders', ['user_id' => 7]);

        $response->assertStatus(409);

        $message = $response->json('message');
        $this->assertStringContainsString('Mouse Wireless', $message);
        $this->assertStringContainsString('11', $message);
        $this->assertStringContainsString('10', $message);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_checkout_product_service_gagal_503(): void
    {
        Log::spy();

        $this->fakeServices([
            1 => ['id' => 1, 'name' => 'Keyboard Mekanikal', 'price' => '500000.00', 'stock' => 25, 'http_status' => 500],
        ], [
            ['product_id' => 1, 'quantity' => 1],
        ]);

        $response = $this->postJson('/orders', ['user_id' => 7]);

        $response->assertStatus(503);

        $this->assertDatabaseCount('orders', 0);

        // Dua log memang by design: ProductClient dan controller sama-sama mencatat.
        Log::shouldHaveReceived('error')->atLeast()->once();
    }

    public function test_checkout_cart_gagal_dikosongkan_tetap_201(): void
    {
        Log::spy();

        $this->fakeServices($this->produkContoh(), [
            ['product_id' => 1, 'quantity' => 1],
        ], clearFails: true);

        $response = $this->postJson('/orders', ['user_id' => 7]);

        $response->assertStatus(201);

        $this->assertDatabaseCount('orders', 1);

        Log::shouldHaveReceived('warning')->once();
    }

    public function test_bayar_dua_kali_409(): void
    {
        $order = Order::create([
            'user_id' => 7,
            'status' => 'PENDING',
            'total_amount' => 150000,
        ]);

        $this->patchJson("/orders/{$order->id}/pay")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'PAID');

        $response = $this->patchJson("/orders/{$order->id}/pay");

        $response->assertStatus(409);
        $this->assertStringContainsString('PAID', $response->json('message'));

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'PAID',
        ]);
    }

    public function test_daftar_status_tidak_valid_422(): void
    {
        $response = $this->getJson('/orders/user/7?status=SHIPPED');

        $response->assertStatus(422)
            ->assertJsonPath('errors.status.0', 'Status harus PENDING atau PAID');
    }

    public function test_id_path_bukan_angka_404(): void
    {
        $this->getJson('/orders/abc')->assertStatus(404);
        $this->getJson('/orders/user/abc')->assertStatus(404);
    }
}
