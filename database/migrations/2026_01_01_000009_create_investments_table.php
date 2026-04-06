<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('type', 20); // InvestmentType enum
            $table->string('institution')->nullable();
            $table->decimal('invested_amount', 15, 2)->default(0);
            $table->decimal('current_amount', 15, 2)->default(0);
            $table->decimal('yield_rate', 8, 4)->nullable();
            $table->string('yield_type', 20)->nullable(); // prefixado | posfixado | hibrido
            $table->date('start_date');
            $table->date('maturity_date')->nullable();
            $table->string('status', 20)->default('active'); // active | redeemed | matured
            $table->softDeletes();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
