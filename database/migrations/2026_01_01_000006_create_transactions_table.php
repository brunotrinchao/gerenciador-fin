<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('credit_card_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('installment_group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->string('type', 20); // TransactionType enum
            $table->string('status', 20)->default('pending'); // TransactionStatus enum
            $table->date('date');
            $table->date('competence_date')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_rule', 50)->nullable();
            $table->boolean('is_imported')->default(false);
            $table->string('import_hash', 64)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('user_id');
            $table->index('import_hash');
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
