<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$contents = App\Models\Content::select('id', 'name', 'title')->get();
foreach ($contents as $c) {
    echo "ID: {$c->id}, Name: {$c->name}, Title: {$c->title}\n";
    // Check if text_content contains JSON
    $text = $c->text_content;
    if (str_starts_with(trim($text), '{')) {
        echo "  -> JSON structure detected\n";
    } else {
        echo "  -> Plain text/HTML detected\n";
    }
}
