<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\Transaction;
use App\Enums\TransactionType;
use App\Enums\TransactionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankAccountBalanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_recalculate_balance_handles_incoming_and_outgoing_transfers()
    {
        $user = \App\Models\User::factory()->create();
        $account = BankAccount::factory()->create([
            'user_id' => $user->id,
            'initial_balance' => 1000,
        ]);

        // Transferência saindo (deve subtrair)
        Transaction::factory()->create([
            'user_id' => $user->id,
            'bank_account_id' => $account->id,
            'amount' => 200,
            'type' => TransactionType::Transfer,
            'status' => TransactionStatus::Paid,
            'description' => 'Transferência → Outra Conta',
        ]);

        // Transferência entrando (deve somar)
        Transaction::factory()->create([
            'user_id' => $user->id,
            'bank_account_id' => $account->id,
            'amount' => 300,
            'type' => TransactionType::Transfer,
            'status' => TransactionStatus::Paid,
            'description' => 'Transferência ← Outra Conta',
        ]);

        $account->recalculateBalance();

        // 1000 - 200 (saída) + 300 (entrada) = 1100
        $this->assertEquals(1100.0, (float)$account->current_balance);
    }
}
