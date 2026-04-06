<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->default('#6b7280');
            $table->string('type', 10)->default('expense'); // income | expense
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
