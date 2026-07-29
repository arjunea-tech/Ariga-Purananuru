<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create contents table with final schema
        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->longText('text_content')->nullable();
            $table->json('external_url')->nullable();
            $table->timestamps();
        });

        // 2. Create content_chapters pivot table (Many-to-Many)
        Schema::create('content_chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained()->onDelete('cascade');
            $table->foreignId('chapter_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['content_id', 'chapter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_chapters');
        Schema::dropIfExists('contents');
    }
};
