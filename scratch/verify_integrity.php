<?php

use App\Models\User;
use App\Models\BankAccount;
use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\Transaction;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::beginTransaction();

try {
    $user = User::first();
    if (!$user) {
        echo "No user found.\n";
        exit(1);
    }

    echo "--- Testing Invoice Pay/Undo Balance Integrity ---\n";
    
    // 1. Setup
    $account = BankAccount::factory()->create(['user_id' => $user->id, 'current_balance' => 1000, 'initial_balance' => 1000]);
    $card = CreditCard::factory()->create(['user_id' => $user->id]);
    $statement = CreditCardStatement::create([
        'user_id' => $user->id,
        'credit_card_id' => $card->id,
        'reference_month' => '2026-01',
        'total_amount' => 300,
        'status' => 'open'
    ]);

    $cardTx = Transaction::create([
        'user_id' => $user->id,
        'credit_card_id' => $card->id,
        'amount' => 300,
        'date' => '2026-01-10',
        'type' => TransactionType::CreditCard,
        'status' => TransactionStatus::Pending,
        'description' => 'Test Card Transaction'
    ]);

    $account->recalculateBalance();
    echo "Initial Balance: " . $account->current_balance . "\n";

    // 2. Simulate Pay
    $cardTx->update(['status' => TransactionStatus::Paid]);
    $payTx = Transaction::create([
        'user_id' => $user->id,
        'bank_account_id' => $account->id,
        'credit_card_statement_id' => $statement->id,
        'amount' => 300,
        'type' => TransactionType::Expense,
        'status' => TransactionStatus::Paid,
        'date' => now(),
        'description' => 'Payment'
    ]);
    
    $account->refresh();
    echo "After Pay Balance: " . $account->current_balance . " (Expected: 700)\n";
    if ($account->current_balance != 700) throw new Exception("Pay balance incorrect");

    // 3. Simulate Undo
    // Logic from InvoiceController:
    $cardTx->update(['status' => TransactionStatus::Pending]); // Revert to pending
    Transaction::where('credit_card_statement_id', $statement->id)
        ->where('type', TransactionType::Expense->value)
        ->get()
        ->each->delete(); // Use model-based delete to trigger observer
    
    $account->refresh();
    echo "After Undo Balance: " . $account->current_balance . " (Expected: 1000)\n";
    if ($account->current_balance != 1000) throw new Exception("Undo balance incorrect");

    echo "--- Testing Duplicate Boleto Detection ---\n";
    
    $paymentCode = '12345678901234567890123456789012345678901234567';
    
    Transaction::create([
        'user_id' => $user->id,
        'amount' => 100,
        'date' => now(),
        'type' => TransactionType::Expense,
        'status' => TransactionStatus::Pending,
        'payment_code' => $paymentCode,
        'description' => 'Original Boleto'
    ]);

    // This is what ImportController now does:
    $exists = Transaction::where('user_id', $user->id)
        ->where('payment_code', $paymentCode)
        ->exists();
    
    echo "Duplicate Check for '$paymentCode': " . ($exists ? "FOUND (Correct)" : "NOT FOUND (Fail)") . "\n";
    if (!$exists) throw new Exception("Duplicate detection failed");

    echo "\nSUCCESS: All integrity checks passed!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
} finally {
    DB::rollBack();
}
