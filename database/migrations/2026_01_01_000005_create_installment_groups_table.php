<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installment_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('credit_card_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('total_amount', 15, 2);
            $table->decimal('installment_amount', 15, 2);
            $table->unsignedSmallInteger('total_installments');
            $table->unsignedSmallInteger('paid_installments')->default(0);
            $table->date('start_date');
            $table->string('status', 20)->default('active'); // InstallmentStatus enum
            $table->softDeletes();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_groups');
    }
};
