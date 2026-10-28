# Microservices Toko Online — Order Service

## 1. Ringkasan

Repo ini berisi ekosistem microservices toko online: **product-service**, **cart-service**,
**review-service**, dan **order-service**. Setiap service punya database sendiri dan hanya
berkomunikasi lewat HTTP API. Fokus repo ini adalah **order-service** (Laravel + MySQL):
service ini mengubah isi keranjang seorang user menjadi pesanan, dengan mengambil data
keranjang dari cart-service dan data produk dari product-service, lalu menyimpan **snapshot
nama dan harga** saat checkout. order-service tidak pernah membaca database service lain.

## 2. Arsitektur

```text
Client (curl / Postman)
          |
          | POST /orders
          v
   order-service :3003  ───── GET /carts/{user_id} ─────>  cart-service :3001
     |        |             DELETE /carts/{user_id}              |
     |        |                                                  v
     |        |                                              cart-db
     |        |                                            (PostgreSQL)
     |        |
     |        └──── GET /products/{id} per item ────────>  product-service :3000
     |                                                          |
     v                                                          v
  order-db                                                product-db
  (MySQL, host 3307)                                      (MySQL)

  review-service :3002  ──────────────────────────────────>  review-db
                                                              (MongoDB)
```

Aturan penting: panah ke database hanya milik service itu sendiri. order-service memanggil
cart-service dan product-service lewat HTTP, bukan lewat koneksi database bersama.

| Service | Teknologi | Port host | Database |
|---|---|---|---|
| product-service | Node.js 22 + Express 5 | 3000 | MySQL 8 (`product-db`, host 3306) |
| cart-service | Laravel 13 (PHP 8.3) | 3001 | PostgreSQL 16 (`cart-db`, host 5432) |
| review-service | Flask 3.1 (Python 3.12) | 3002 | MongoDB 7 (`review-db`, host 27017) |
| order-service | Laravel 13 (PHP 8.3) | 3003 | MySQL 8 (`order-db`, host 3307) |

### Alur checkout

1. Client mengirim `POST /orders` dengan body `{"user_id": 37}`.
2. order-service memanggil `GET http://cart-service:3001/carts/37`.
3. Untuk setiap item di keranjang, order-service memanggil
   `GET http://product-service:3000/products/{id}`.
4. order-service memvalidasi produk ada dan `stock >= quantity`, lalu menghitung
   `subtotal = unit_price × quantity` dan `total_amount`.
5. Dalam satu `DB::transaction`, order-service menyimpan satu baris `orders` dan semua
   baris `order_items` (snapshot `product_name`, `unit_price`, `subtotal`).
6. Setelah transaksi commit, order-service memanggil `DELETE /carts/37` ke cart-service.
   Kalau langkah ini gagal, pesanan tetap tersimpan dan kegagalan dicatat sebagai warning.
7. order-service membalas `201 Created` berisi pesanan beserta itemnya.

## 3. Cara menjalankan

### Prasyarat

- Docker Desktop (Windows/macOS) atau Docker Engine + Docker Compose v2 (Linux).
- Port host berikut tidak dipakai proses lain: `3000`, `3001`, `3002`, `3003`, `3306`,
  `3307`, `5432`, `27017`.

### Dari clone baru

```powershell
git clone https://github.com/apolloastro322-png/microservice.git
cd microservice
docker compose up --build
```

Tidak perlu membuat file `.env`, menyalin `.env.example`, atau menjalankan `migrate` manual.
Semua konfigurasi diberikan lewat `environment` di `docker-compose.yml`, dan container
order-service/cart-service menjalankan migration saat start. Build pertama bisa beberapa
menit karena memasang dependency; build berikutnya memakai cache.

### Menunggu sampai siap

Biarkan `docker compose up --build` berjalan di terminal pertama. Di terminal kedua:

```powershell
docker compose ps
```

Semua service harus `Up`; `product-db`, `cart-db`, `review-db`, dan `order-db` harus
`healthy`. Log order-service juga bisa diikuti sampai server siap:

```powershell
docker compose logs -f order-service
```

Tanda siapnya adalah baris `Server running on [http://0.0.0.0:3003]`. Tekan `Ctrl+C` untuk
berhenti mengikuti log (container tetap berjalan).

### Cek health tiap service

```powershell
curl.exe -s http://localhost:3003/health
curl.exe -s http://localhost:3000/health
curl.exe -s http://localhost:3002/health
curl.exe -s -o NUL -w "%{http_code}\n" http://localhost:3001/up
```

Hasil yang diharapkan:

```json
{"status":"ok","service":"order-service"}
{"status":"ok","service":"product-service"}
{"service":"review-service","status":"ok"}
```

Perintah terakhir harus mencetak `200`. cart-service memakai endpoint health bawaan Laravel
(`/up`) yang membalas halaman HTML, jadi yang dicek adalah status HTTP-nya. Di Linux/macOS,
ganti `NUL` dengan `/dev/null`.

### Menghentikan

```powershell
docker compose down
```

Perintah ini menghentikan dan menghapus container, tetapi **menyimpan volume data**. Data
pesanan, keranjang, produk, dan review tetap ada saat `docker compose up` berikutnya.

> **Peringatan:** `docker compose down -v` juga menghapus semua volume database
> (`product-db-data`, `cart-db-data`, `review-db-data`, `order-db-data`). Semua data akan
> hilang dan product-service akan kembali ke data seed saat dijalankan lagi.

## 4. Endpoint order-service

Semua response berbentuk JSON dan selalu punya `message`. Response sukses menambahkan
`data`; response validasi menambahkan `errors`.

| Method | Path | Sukses | Kondisi gagal |
|---|---|---|---|
| GET | `/health` | 200 | — |
| POST | `/orders` | 201 | 422 body tidak valid; 409 keranjang kosong / produk tidak ada / stok kurang; 503 cart-service atau product-service bermasalah; 500 error tak terduga |
| GET | `/orders/{id}` | 200 | 404 pesanan tidak ada (id non-angka juga 404); 500 |
| GET | `/orders/user/{userId}?status=` | 200 | 422 `status` bukan `PENDING`/`PAID`; 404 `userId` non-angka; 500 |
| PATCH | `/orders/{id}/pay` | 200 | 404 pesanan tidak ada; 409 status bukan `PENDING`; 500 |

Catatan:

- Status pesanan hanya `PENDING` dan `PAID`.
- Daftar pesanan user diurutkan terbaru di atas; filter `?status=` opsional.
- Detail teknis pada 500/503 hanya dikirim saat `APP_DEBUG=true`. Saat `APP_DEBUG=false`,
  body 500/503 hanya berisi `message`.

### Contoh curl (Windows PowerShell)

Contoh memakai `curl.exe` dan mengirim JSON lewat pipe (`--data-binary "@-"`). Cara ini
dipakai karena PowerShell tidak meneruskan tanda kutip di dalam JSON dengan benar saat
memakai `-d "{\"...\"}"`. Di Linux/macOS, ganti `curl.exe` dengan `curl` (dan `NUL` dengan
`/dev/null` pada cek health cart). Nilai `id` dan timestamp pada contoh mengikuti urutan
perintah di halaman ini; kalau urutannya berbeda, nilainya akan berbeda. Urutan `items`
juga mengikuti urutan yang dikembalikan cart-service (item yang lebih baru bisa muncul
lebih dulu), jadi urutannya bisa berbeda meskipun isi dan totalnya sama.

#### GET /health

```powershell
curl.exe -s -i http://localhost:3003/health
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok","service":"order-service"}
```

#### POST /orders — 201

Siapkan keranjang user 37 berisi 2 Keyboard Mekanikal dan 1 Mouse Wireless:

```powershell
'{"user_id":37,"product_id":1,"quantity":2}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
'{"user_id":37,"product_id":2,"quantity":1}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
```

Buat pesanan, tampilkan response, lalu simpan id pesanan untuk contoh berikutnya:

```powershell
$orderJson = '{"user_id":37}' | curl.exe -s -X POST http://localhost:3003/orders -H "Content-Type: application/json" --data-binary "@-"
$orderJson
$orderId = ($orderJson | ConvertFrom-Json).data.id
```

Response body (status `201 Created`; id dan timestamp mengikuti database Anda):

```json
{"message":"Pesanan berhasil dibuat","data":{"user_id":37,"status":"PENDING","total_amount":1350000,"updated_at":"2026-10-28T14:58:54.000000Z","created_at":"2026-10-28T14:58:54.000000Z","id":1,"items":[{"id":1,"order_id":1,"product_id":1,"product_name":"Keyboard Mekanikal","unit_price":500000,"subtotal":1000000,"quantity":2,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"},{"id":2,"order_id":1,"product_id":2,"product_name":"Mouse Wireless","unit_price":350000,"subtotal":350000,"quantity":1,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"}]}}
```

#### POST /orders — 422 body tidak valid

```powershell
'{}' | curl.exe -s -i -X POST http://localhost:3003/orders -H "Content-Type: application/json" --data-binary "@-"
```

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/json

{"message":"Data yang dikirim tidak valid","errors":{"user_id":["Field user id wajib diisi"]}}
```

#### POST /orders — 409 keranjang kosong

```powershell
'{"user_id":99}' | curl.exe -s -i -X POST http://localhost:3003/orders -H "Content-Type: application/json" --data-binary "@-"
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{"message":"Keranjang user 99 kosong"}
```

#### POST /orders — 409 stok kurang

Isi keranjang user 32 dengan 11 Mouse Wireless (stok seed hanya 10), lalu checkout:

```powershell
'{"user_id":32,"product_id":2,"quantity":11}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
'{"user_id":32}' | curl.exe -s -i -X POST http://localhost:3003/orders -H "Content-Type: application/json" --data-binary "@-"
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{"message":"Stok Mouse Wireless tidak mencukupi: diminta 11, tersedia 10"}
```

Keranjang tidak dikosongkan saat checkout ditolak, jadi item tetap ada untuk diperbaiki.

#### POST /orders — 503 product-service mati

Siapkan keranjang user 33, hentikan product-service, checkout, lalu nyalakan lagi:

```powershell
'{"user_id":33,"product_id":1,"quantity":1}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
docker compose stop product-service
'{"user_id":33}' | curl.exe -s -i -X POST http://localhost:3003/orders -H "Content-Type: application/json" --data-binary "@-"
docker compose start product-service
```

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{"message":"Product service tidak dapat dihubungi, coba lagi nanti","error":"Product service tidak dapat dihubungi, coba lagi nanti","location":"\/app\/app\/Clients\/ProductClient.php:61"}
```

`error` dan `location` muncul karena `APP_DEBUG=true` di compose. Dengan
`APP_DEBUG=false`, body hanya berisi `{"message":"Product service tidak dapat dihubungi, coba lagi nanti"}`.

#### GET /orders/{id} — 200

```powershell
curl.exe -s -i http://localhost:3003/orders/$orderId
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"message":"Berhasil mengambil pesanan","data":{"id":1,"user_id":37,"status":"PENDING","total_amount":1350000,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z","items":[{"id":1,"order_id":1,"product_id":1,"product_name":"Keyboard Mekanikal","unit_price":500000,"subtotal":1000000,"quantity":2,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"},{"id":2,"order_id":1,"product_id":2,"product_name":"Mouse Wireless","unit_price":350000,"subtotal":350000,"quantity":1,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"}]}}
```

#### GET /orders/{id} — 404

```powershell
curl.exe -s -i http://localhost:3003/orders/999999
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"message":"Pesanan dengan id 999999 tidak ditemukan"}
```

#### PATCH /orders/{id}/pay — 200

```powershell
curl.exe -s -i -X PATCH http://localhost:3003/orders/$orderId/pay
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"message":"Pesanan berhasil dibayar","data":{"id":1,"user_id":37,"status":"PAID","total_amount":1350000,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:59:25.000000Z","items":[{"id":1,"order_id":1,"product_id":1,"product_name":"Keyboard Mekanikal","unit_price":500000,"subtotal":1000000,"quantity":2,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"},{"id":2,"order_id":1,"product_id":2,"product_name":"Mouse Wireless","unit_price":350000,"subtotal":350000,"quantity":1,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"}]}}
```

#### PATCH /orders/{id}/pay — 409 sudah PAID

```powershell
curl.exe -s -i -X PATCH http://localhost:3003/orders/$orderId/pay
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{"message":"Pesanan berstatus PAID, hanya pesanan PENDING yang dapat dibayar"}
```

#### GET /orders/user/{userId}?status= — 200

```powershell
curl.exe -s -i "http://localhost:3003/orders/user/37?status=PAID"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"message":"Berhasil mengambil daftar pesanan","data":[{"id":1,"user_id":37,"status":"PAID","total_amount":1350000,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:59:25.000000Z","items":[{"id":1,"order_id":1,"product_id":1,"product_name":"Keyboard Mekanikal","unit_price":500000,"subtotal":1000000,"quantity":2,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"},{"id":2,"order_id":1,"product_id":2,"product_name":"Mouse Wireless","unit_price":350000,"subtotal":350000,"quantity":1,"created_at":"2026-10-28T14:58:54.000000Z","updated_at":"2026-10-28T14:58:54.000000Z"}]}]}
```

#### GET /orders/user/{userId}?status= — 422 status tidak valid

```powershell
curl.exe -s -i "http://localhost:3003/orders/user/37?status=SHIPPED"
```

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/json

{"message":"Data yang dikirim tidak valid","errors":{"status":["Status harus PENDING atau PAID"]}}
```

### Contoh pemanggilan cart-service dan product-service

order-service memakai tiga panggilan berikut. Isi dulu keranjang yang dipakai contoh:

```powershell
'{"user_id":30,"product_id":1,"quantity":2}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
'{"user_id":30,"product_id":2,"quantity":1}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
'{"user_id":34,"product_id":3,"quantity":1}' | curl.exe -s -X POST http://localhost:3001/carts -H "Content-Type: application/json" --data-binary "@-"
```

```powershell
# GET /carts/{userId} — dipakai untuk membaca isi keranjang
curl.exe -s http://localhost:3001/carts/30

# DELETE /carts/{userId} — dipakai setelah pesanan berhasil disimpan
curl.exe -s -X DELETE http://localhost:3001/carts/34

# GET /products/{id} — dipakai untuk setiap item keranjang
curl.exe -s http://localhost:3000/products/1
```

Contoh response `GET /carts/30` saat keranjang berisi 2 Keyboard dan 1 Mouse:

```json
{"message":"Berhasil mengambil keranjang","data":{"user_id":30,"items":[{"id":5,"user_id":30,"product_id":1,"quantity":2,"created_at":"2026-10-28T14:59:30.000000Z","updated_at":"2026-10-28T14:59:30.000000Z"},{"id":6,"user_id":30,"product_id":2,"quantity":1,"created_at":"2026-10-28T14:59:30.000000Z","updated_at":"2026-10-28T14:59:30.000000Z"}],"total_quantity":3}}
```

Contoh response `DELETE /carts/34`:

```json
{"message":"Keranjang berhasil dikosongkan","data":{"deleted_items":1}}
```

Contoh response `GET /products/1`:

```json
{"message":"Berhasil mengambil detail produk","data":{"id":1,"name":"Keyboard Mekanikal","price":"500000.00","description":"Keyboard mekanikal switch blue","stock":25,"image":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==","created_at":"2026-10-28T14:58:25.000Z"}}
```

`price` dari product-service dikirim sebagai string (`"500000.00"`); order-service
mengubahnya menjadi angka sebelum menghitung total.

Data seed product-service pada clone baru:

| id | Nama | Harga | Stok |
|---|---|---|---|
| 1 | Keyboard Mekanikal | 500000 | 25 |
| 2 | Mouse Wireless | 350000 | 10 |
| 3 | Headset Gaming | 800000 | 15 |

## 5. Environment variable

Nilai di bawah adalah nilai **dev** yang memang dipakai `docker-compose.yml`, bukan
kredensial produksi. `.env.example` adalah contoh konfigurasi; beberapa nilainya berbeda
karena ditujukan untuk dijalankan di host (mis. `DB_HOST=127.0.0.1` di order/cart dan
`MONGO_URI`/`PRODUCT_SERVICE_URL` localhost di review). Compose menimpa nilai itu dengan
nama service di jaringan Docker; tabel ini memakai nilai compose.

Perbedaan yang disengaja: `.env.example` order/cart memakai `DB_HOST=127.0.0.1` dan
`LOG_CHANNEL=stack`, sedangkan compose memakai nama service dan `stderr`. `.env.example`
cart tidak memuat `PRODUCT_SERVICE_URL`; compose menambahkannya. `.env.example` review
memakai `localhost` untuk Mongo dan product-service; compose memakai nama service.
`.env.example` product memuat `PORT=3000`; compose tidak menetapkannya dan `server.js`
memakai default `3000`.

### order-service

| Variabel | Nilai di compose | Keterangan |
|---|---|---|
| `APP_NAME` | `order-service` | Nama aplikasi |
| `APP_ENV` | `local` | Environment lokal |
| `APP_DEBUG` | `true` | Detail 500/503 ikut di response; set `false` untuk menyembunyikannya |
| `APP_KEY` | `base64:EUj20G5tq3GHo0geQf7PKVhfIlJZISNvqr3ewpDsk5Y=` | Kunci demo lokal, bukan untuk produksi |
| `APP_URL` | `http://localhost:3003` | URL publik service |
| `LOG_CHANNEL` | `stderr` | Log muncul di `docker compose logs order-service` |
| `DB_CONNECTION` | `mysql` | Driver database |
| `DB_HOST` | `order-db` | Nama service database di jaringan compose |
| `DB_PORT` | `3306` | Port **di dalam container** |
| `DB_DATABASE` | `orderdb` | Nama database |
| `DB_USERNAME` | `appuser` | User database |
| `DB_PASSWORD` | `apppassword` | Password dev |
| `CART_SERVICE_URL` | `http://cart-service:3001` | Base URL cart-service |
| `PRODUCT_SERVICE_URL` | `http://product-service:3000` | Base URL product-service |
| `ORDER_HTTP_TIMEOUT` | `5` | Timeout HTTP ke cart/product dalam detik; default 5, nilai compose 5, maksimal 5 detik sesuai ketentuan tugas |

### product-service

| Variabel | Nilai di compose |
|---|---|
| `DB_HOST` | `product-db` |
| `DB_USER` | `appuser` |
| `DB_PASSWORD` | `apppassword` |
| `DB_NAME` | `productdb` |

`PORT` tidak di-set di compose; `server.js` memakai default `3000`.

### cart-service

| Variabel | Nilai di compose |
|---|---|
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `cart-db` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `cartdb` |
| `DB_USERNAME` | `appuser` |
| `DB_PASSWORD` | `apppassword` |
| `PRODUCT_SERVICE_URL` | `http://product-service:3000` |
| `LOG_CHANNEL` | `stderr` |

`APP_KEY` tidak di-set di compose; cart-service tetap bisa boot dan melayani API tanpa itu
(sudah diuji dari clone bersih).

### review-service

| Variabel | Nilai di compose |
|---|---|
| `HOST` | `0.0.0.0` |
| `PORT` | `3002` |
| `FLASK_DEBUG` | `1` |
| `MONGO_URI` | `mongodb://appuser:apppassword@review-db:27017/?authSource=admin` |
| `MONGO_DB_NAME` | `reviewdb` |
| `PRODUCT_SERVICE_URL` | `http://product-service:3000` |

### Database container dan port

| Container | Image | Port container | Port host | Database / kredensial dev |
|---|---|---|---|---|
| `product-db` | `mysql:8.0` | 3306 | 3306 | `productdb`, user `appuser`, password `apppassword` |
| `cart-db` | `postgres:16-alpine` | 5432 | 5432 | `cartdb`, user `appuser`, password `apppassword` |
| `review-db` | `mongo:7` | 27017 | 27017 | user `appuser`, password `apppassword` |
| `order-db` | `mysql:8.0` | 3306 | 3307 | `orderdb`, user `appuser`, password `apppassword` |

Di dalam jaringan Docker, order-service menghubungi `order-db:3306`. Dari laptop, database
yang sama diakses lewat `localhost:3307` karena port host `3306` sudah dipakai
`product-db`. Karena itu `DB_PORT=3306` di environment order-service, sedangkan klien
MySQL dari host memakai port `3307`.

## 6. Keputusan desain

**Arsitektur berlapis: routes → Form Request → controller → service → model/client.**
Route hanya memetakan method dan path. Form Request memvalidasi sebelum controller jalan.
Controller hanya membentuk response JSON dan memetakan exception ke status HTTP. Service
memegang logika bisnis tanpa tahu HTTP, sedangkan `CartClient`/`ProductClient` adalah
satu-satunya tempat panggilan HTTP keluar. Model hanya menangani Eloquent dan cast.

**Snapshot nama dan harga saat checkout.**
`order_items` menyimpan `product_name`, `unit_price`, dan `subtotal` hasil salinan saat
checkout, bukan membaca ulang product-service. Kalau harga produk berubah setelahnya,
pesanan lama tetap menampilkan harga saat dibeli. Ini yang membuat riwayat pesanan dan
perhitungan total bisa dipertanggungjawabkan.

**Validasi semua item dulu, baru satu `DB::transaction`.**
Semua panggilan cart/product dan pengecekan stok diselesaikan sebelum transaksi database
dibuka. Kalau satu item gagal, tidak ada baris `orders` yang tersimpan. Transaksi juga
tidak menahan koneksi database selama menunggu HTTP service lain.

**Pesanan tersimpan tetapi cart gagal dikosongkan tetap 201.**
Pengosongan keranjang dilakukan setelah transaksi commit. Kalau cart-service gagal
dihubungi, order-service mencatat `Log::warning` berisi `user_id`, `order_id`, dan error,
tetapi tidak membatalkan pesanan yang sudah sah. Client tidak dipaksa mengulang checkout
hanya karena operasi pembersihan gagal.

**Timeout 5 detik dan exception khusus per jenis kegagalan.**
`ORDER_HTTP_TIMEOUT` membatasi panggilan ke cart/product. `EmptyCartException` dan
`ProductUnavailableException` menjadi 409 karena ini penolakan bisnis;
`ServiceUnavailableException` menjadi 503 karena infrastruktur bermasalah. Controller
adalah satu-satunya tempat pemetaan exception ke status HTTP, sehingga bentuk response
konsisten.

**Detail teknis 500/503 hanya saat `APP_DEBUG=true`.**
Di production, body error tidak boleh membocorkan path file atau lokasi kode. Log tetap
mencatat detail lengkap beserta konteks, sedangkan client hanya menerima pesan umum.
Di compose `APP_DEBUG=true` supaya demo dan troubleshooting tetap mudah.

**Port host 3307 untuk `order-db`.**
`product-db` sudah memakai port host `3306`. Dua container MySQL tidak bisa memakai port
host yang sama, jadi `order-db` dipetakan ke `3307:3306`. Di dalam jaringan compose
keduanya tetap memakai port standar `3306`.

**Pembayaran hanya mengubah status.**
`PATCH /orders/{id}/pay` mengubah `PENDING` menjadi `PAID` dengan update bersyarat, sehingga
dua request bersamaan tidak sama-sama sukses. Stok tidak dikurangi dan tidak ada reservasi;
pengurangan stok memang di luar lingkup tugas ini.

## 7. Keterbatasan yang disadari

- **Tanpa autentikasi.** `user_id` dipercaya dari body/URL; siapa pun yang bisa mengakses
  port service bisa membuat atau membaca pesanan user lain.
- **Tanpa idempotency.** Checkout yang diulang membuat pesanan baru. Kalau pengosongan
  keranjang gagal, keranjang masih berisi item dan checkout ulang bisa menghasilkan pesanan
  kedua.
- **Stok tidak dikurangi.** Checkout hanya memeriksa `stock >= quantity`; tidak ada
  reservasi, sehingga dua checkout bersamaan bisa sama-sama lolos meskipun stok tidak cukup
  untuk keduanya.
- **Timeout 5 detik tanpa retry.** Gangguan jaringan sesaat langsung menjadi 503; tidak ada
  retry, backoff, atau circuit breaker.
- **Tanpa pagination.** `GET /orders/user/{userId}` mengembalikan seluruh pesanan user
  sekaligus.
- **Komunikasi sinkron.** order-service memanggil cart-service dan product-service secara
  langsung. Kalau salah satu mati atau lambat, checkout gagal dengan 503; tidak ada queue
  atau message broker.

## 8. Struktur repo

```text
microservice/
├── docker-compose.yml
├── README.md
├── order-service/       # Laravel 13 + MySQL, port 3003
│   ├── app/
│   │   ├── Clients/     # CartClient, ProductClient
│   │   ├── Exceptions/  # exception bisnis dan service
│   │   ├── Http/        # controller + Form Request
│   │   ├── Models/      # Order, OrderItem
│   │   └── Services/    # OrderService
│   ├── database/migrations/
│   ├── routes/api.php
│   └── Dockerfile
├── product-service/     # Node.js/Express + MySQL, port 3000
├── cart-service/        # Laravel 13 + PostgreSQL, port 3001
├── review-service/      # Flask + MongoDB, port 3002
└── ecommerce-ui/        # React + Vite, tidak dijalankan oleh docker compose
```
