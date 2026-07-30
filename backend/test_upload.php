<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $file = new \Illuminate\Http\UploadedFile(__DIR__.'/dummy.pdf', 'dummy.pdf', 'application/pdf', null, true);
    
    // bypass curl SSL issue for testing
    \Cloudinary\Configuration\Configuration::instance()->api->verify = false;

    $response = cloudinary()->uploadApi()->upload($file->getRealPath(), [
        'folder' => 'contents/pdfs',
        'resource_type' => 'auto'
    ]);
    echo "SUCCESS: " . $response['secure_url'] . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
