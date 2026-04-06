<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_card_statements', function (Blueprint $table) {
            $table->string('file_name')->nullable()->after('file_path');
            $table->json('raw_items')->nullable()->after('file_name');
            $table->json('parsed_items')->nullable()->after('raw_items');
        });
    }

    public function down(): void
    {
        Schema::table('credit_card_statements', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'raw_items', 'parsed_items']);
        });
    }
};
