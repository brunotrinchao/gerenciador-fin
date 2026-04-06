<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_card_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('credit_card_id')->constrained()->cascadeOnDelete();
            $table->string('reference_month', 7); // YYYY-MM
            $table->date('closing_date')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->string('status', 20)->default('open'); // open | closed | paid
            $table->string('file_path')->nullable();
            $table->string('import_status', 20)->nullable(); // processing | review_pending | completed | failed
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->unique(['credit_card_id', 'reference_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_card_statements');
    }
};
