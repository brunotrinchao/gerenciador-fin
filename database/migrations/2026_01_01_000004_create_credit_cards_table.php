<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('brand', 30)->nullable(); // visa, mastercard, etc.
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->decimal('available_limit', 15, 2)->default(0);
            $table->unsignedTinyInteger('closing_day');
            $table->unsignedTinyInteger('due_day');
            $table->string('color', 7)->default('#6366f1');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_cards');
    }
};
