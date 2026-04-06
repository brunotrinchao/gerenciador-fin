<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_transaction_id')->nullable()->after('id');
            $table->foreign('parent_transaction_id')->references('id')->on('transactions')->nullOnDelete();
            $table->date('recurrence_end_date')->nullable()->after('recurrence_rule');
            $table->integer('recurrence_occurrences')->nullable()->after('recurrence_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['parent_transaction_id']);
            $table->dropColumn(['parent_transaction_id', 'recurrence_end_date', 'recurrence_occurrences']);
        });
    }
};
