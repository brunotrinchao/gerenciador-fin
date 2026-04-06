<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('credit_card_statement_id')
                  ->nullable()
                  ->after('credit_card_id')
                  ->constrained('credit_card_statements')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['credit_card_statement_id']);
            $table->dropColumn('credit_card_statement_id');
        });
    }
};
