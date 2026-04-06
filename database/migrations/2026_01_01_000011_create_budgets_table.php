<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('period', 10)->default('monthly'); // monthly | yearly
            $table->string('reference_month', 7)->nullable(); // YYYY-MM (null = recorrente)
            $table->timestamps();

            $table->index('user_id');
            $table->unique(['user_id', 'category_id', 'reference_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
