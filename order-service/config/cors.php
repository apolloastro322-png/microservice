<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Path di sini harus eksplisit karena routes/api.php dipasang tanpa awalan
    | /api (lihat bootstrap/app.php), jadi default 'api/*' tidak cocok.
    |
    */

    'paths' => ['orders', 'orders/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
