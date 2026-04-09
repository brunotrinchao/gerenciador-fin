<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scheduled_transaction_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('processed_at');
            $table->unsignedInteger('transactions_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->json('processed_transaction_ids')->nullable();
            $table->json('failed_transaction_ids')->nullable();
            $table->unsignedInteger('execution_ms')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_transaction_logs');
    }
};
