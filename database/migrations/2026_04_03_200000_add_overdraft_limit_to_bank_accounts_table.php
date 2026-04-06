<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->decimal('overdraft_limit', 15, 2)->default(0)->after('current_balance');
        });
    }

    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn('overdraft_limit');
        });
    }
};
