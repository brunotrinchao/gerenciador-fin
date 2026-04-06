<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('number');
            $table->decimal('amount', 15, 2);
            $table->date('due_date');
            $table->string('status', 20)->default('pending'); // TransactionStatus enum
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('installment_group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
