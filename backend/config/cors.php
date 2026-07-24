<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_merge(
        [
            'http://localhost',
            'https://localhost',
            'capacitor://localhost',
            'http://localhost:4200',
            'http://localhost:8100',
            'http://localhost:8000',
            'https://ariga-purananuru-frontend.vercel.app',
            'https://ariga-purananuru-mobile-kk8k.vercel.app',
        ],
        array_filter(array_map('trim', explode(',', env('ALLOWED_ORIGINS', ''))))
    ))),

    'allowed_origins_patterns' => [
        '#^https?://.*\.vercel\.app$#',
        '#^https?://localhost(:[0-9]+)?$#',
        '#^capacitor://localhost$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
