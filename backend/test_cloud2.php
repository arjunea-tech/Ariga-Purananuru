<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

putenv('SSL_CERT_FILE=' . storage_path('cacert.pem'));

try {
    $options = [
        'folder' => 'contents/pdfs',
        'resource_type' => 'raw',
        'public_id' => uniqid() . '.pdf'
    ];
    $response = cloudinary()->uploadApi()->upload('public/index.php', $options);
    echo "SUCCESS!\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
