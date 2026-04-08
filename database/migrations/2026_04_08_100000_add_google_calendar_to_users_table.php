<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Token armazenado encriptado como JSON: {access_token, refresh_token, expires_in, created}
            $table->text('google_calendar_token')->nullable()->after('avatar');
            $table->boolean('google_calendar_enabled')->default(false)->after('google_calendar_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_calendar_token', 'google_calendar_enabled']);
        });
    }
};
