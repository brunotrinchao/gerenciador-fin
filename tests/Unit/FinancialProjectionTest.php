<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\BankAccount;
use App\Models\Transaction;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Services\FinancialProjectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialProjectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_projection_accumulates_correctly_from_current_balance()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // 1. Saldo em conta: R$ 5.000
        BankAccount::factory()->create([
            'user_id' => $user->id,
            'current_balance' => 5000.00,
            'is_active' => true,
        ]);

        // 2. Receita pendente em Abril: R$ 17.000
        Transaction::factory()->create([
            'user_id' => $user->id,
            'amount' => 17000.00,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Pending,
            'date' => now()->startOfMonth(), // Garante mês atual
        ]);

        // 3. Despesa pendente em Abril: R$ 2.000
        Transaction::factory()->create([
            'user_id' => $user->id,
            'amount' => 2000.00,
            'type' => TransactionType::Expense,
            'status' => TransactionStatus::Pending,
            'date' => now()->startOfMonth(),
        ]);

        $service = new FinancialProjectionService();
        $projection = $service->generate($user->id, 1);
        $april = $projection[0];

        // Verificações:
        // Entrada Acumulada = Saldo Anterior (5.000) + Receita (17.000) = 22.000
        $this->assertEquals(22000.00, $april['entrada_total'], "Entrada Total do primeiro mês deve somar saldo bancário + receita");
        
        // Resultado = 2.000
        $this->assertEquals(2000.00, $april['resultado'], "Resultado deve ser a soma das despesas");

        // Saldo Projetado = 22.000 - 2.000 = 20.000
        $this->assertEquals(20000.00, $april['balance'], "Saldo Projetado deve ser Entrada Acumulada - Resultado");
    }
}
