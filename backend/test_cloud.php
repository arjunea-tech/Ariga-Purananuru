<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $options = [
        'folder' => 'contents/pdfs',
        'resource_type' => 'raw',
        'public_id' => uniqid() . '.pdf'
    ];
    $response = cloudinary()->uploadApi()->upload('public/index.php', $options);
    print_r($response);
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    if (method_exists($e, 'getResponse')) {
        echo $e->getResponse()->getBody()->getContents() . "\n";
    }
}
