<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investment_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investment_id')->constrained()->cascadeOnDelete();
            $table->date('reference_date');
            $table->decimal('amount', 15, 2);
            $table->decimal('yield_amount', 15, 2)->default(0);
            $table->decimal('yield_percentage', 8, 4)->default(0);
            $table->timestamps();

            $table->index('investment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investment_snapshots');
    }
};
