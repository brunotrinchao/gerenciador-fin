<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_code', 150)->nullable()->after('import_hash');
            $table->string('beneficiary_name', 255)->nullable()->after('payment_code');
            $table->string('beneficiary_document', 20)->nullable()->after('beneficiary_name');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['payment_code', 'beneficiary_name', 'beneficiary_document']);
        });
    }
};
