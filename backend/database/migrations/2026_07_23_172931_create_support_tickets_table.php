<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');  // student
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('set null');
            $table->string('subject');
            $table->text('message');
            $table->string('category')->default('general');  // general, technical, content, billing
            $table->string('priority')->default('normal');   // low, normal, high, urgent
            $table->string('status')->default('open');       // open, in_progress, resolved, closed
            $table->text('admin_reply')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
