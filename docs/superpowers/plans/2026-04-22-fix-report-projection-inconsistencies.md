# Plano de Implementação: Correção de Inconsistências em Relatórios e Projeções

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir dados de saldo, relatórios de gastos e projeções futuras, tratando transferências como neutras e incluindo dívidas parceladas e atrasadas.

**Architecture:** Mudar transferências para tipo `Transfer`, ajustar recálculo de saldo bancário, incluir parcelas pendentes no patrimônio líquido e pendências atrasadas na projeção de fluxo de caixa.

**Tech Stack:** Laravel 11, PHP 8.3, Pest PHP.

---

### Task 1: Recálculo de Saldo Bancário com Transferências

**Files:**
- Modify: `app/Models/BankAccount.php`
- Create: `tests/Feature/BankAccountBalanceTest.php`

- [ ] **Step 1: Criar teste de falha para saldo com transferência**

```php
// tests/Feature/BankAccountBalanceTest.php
use App\Models\BankAccount;
use App\Models\Transaction;
use App\Enums\TransactionType;
use App\Enums\TransactionStatus;

test('recalculateBalance handles incoming and outgoing transfers', function () {
    $user = \App\Models\User::factory()->create();
    $account = BankAccount::factory()->create([
        'user_id' => $user->id,
        'initial_balance' => 1000,
    ]);

    // Transferência saindo (deve subtrair)
    Transaction::factory()->create([
        'bank_account_id' => $account->id,
        'amount' => 200,
        'type' => TransactionType::Transfer,
        'status' => TransactionStatus::Paid,
    ]);

    // Transferência entrando (deve somar) - Simulando via bank_account_id direto
    // Na prática, o sistema cria outra transação para a conta destino.
    Transaction::factory()->create([
        'bank_account_id' => $account->id,
        'amount' => 300,
        'type' => TransactionType::Transfer,
        'status' => TransactionStatus::Paid,
        'description' => 'Transferência ← Outra Conta',
    ]);

    $account->recalculateBalance();

    // 1000 - 200 (saída) + 300 (entrada) = 1100
    // Atualmente falha porque só subtrai Transfer.
    expect((float)$account->current_balance)->toBe(1100.0);
});
```

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `php artisan test tests/Feature/BankAccountBalanceTest.php`
Expected: FAIL (Saldo será 800 ou algo diferente de 1100)

- [ ] **Step 3: Implementar lógica de entrada/saída em `recalculateBalance`**

```php
// app/Models/BankAccount.php
public function recalculateBalance(): void
{
    $income = Transaction::where('bank_account_id', $this->id)
        ->where(function($q) {
            $q->whereIn('type', [
                TransactionType::Income->value, 
                TransactionType::InvestmentOut->value
            ])
            ->orWhere(function($sq) {
                // Transferência entrando: identificada pela descrição (convenção temporária até ter destination_id)
                $sq->where('type', TransactionType::Transfer->value)
                   ->where('description', 'like', '%←%');
            });
        })
        ->where('status', TransactionStatus::Paid->value)
        ->sum('amount');

    $expense = Transaction::where('bank_account_id', $this->id)
        ->where(function($q) {
            $q->whereIn('type', [
                TransactionType::Expense->value, 
                TransactionType::InvestmentIn->value,
                TransactionType::CreditCard->value
            ])
            ->orWhere(function($sq) {
                // Transferência saindo
                $sq->where('type', TransactionType::Transfer->value)
                   ->where('description', 'like', '%→%');
            });
        })
        ->where('status', TransactionStatus::Paid->value)
        ->sum('amount');

    $this->update([
        'current_balance' => $this->initial_balance + $income - $expense,
    ]);
}
```

- [ ] **Step 4: Rodar teste para verificar sucesso**

Run: `php artisan test tests/Feature/BankAccountBalanceTest.php`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Models/BankAccount.php tests/Feature/BankAccountBalanceTest.php
git commit -m "fix(bank): correctly handle transfer directions in balance calculation"
```

---

### Task 2: Ajuste no Registro de Transferências

**Files:**
- Modify: `app/Http/Controllers/TransactionController.php`

- [ ] **Step 1: Alterar `store` para usar o tipo `Transfer`**

```php
// app/Http/Controllers/TransactionController.php
// Dentro do bloco if ($type === TransactionType::Transfer)

// Saída da conta origem
Transaction::create([
    'user_id'         => $userId,
    'bank_account_id' => $fromAccount->id,
    'description'     => $data['description'] . ' → ' . $toAccount->name,
    'amount'          => $data['amount'],
    'type'            => TransactionType::Transfer, // Mudado de Expense
    'status'          => TransactionStatus::from($data['status']),
    'date'            => $data['date'],
    'notes'           => $data['notes'] ?? null,
    'category_id'     => $data['category_id'] ?? null,
]);

// Entrada na conta destino
Transaction::create([
    'user_id'         => $userId,
    'bank_account_id' => $toAccount->id,
    'description'     => $data['description'] . ' ← ' . $fromAccount->name,
    'amount'          => $data['amount'],
    'type'            => TransactionType::Transfer, // Mudado de Income
    'status'          => TransactionStatus::from($data['status']),
    'date'            => $data['date'],
    'notes'           => $data['notes'] ?? null,
    'category_id'     => $data['category_id'] ?? null,
]);
```

- [ ] **Step 2: Verificar manualmente criando uma transferência**
Expected: Balanços das contas atualizados corretamente, mas as transações agora têm tipo "Transferência".

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/TransactionController.php
git commit -m "feat(tx): store transfers with specific Transfer type instead of income/expense"
```

---

### Task 3: Inclusão de Pendências Atrasadas na Projeção

**Files:**
- Modify: `app/Services/FinancialProjectionService.php`

- [ ] **Step 1: Ajustar query de transações pendentes**

```php
// app/Services/FinancialProjectionService.php:48
Transaction::byUser($userId)
    ->where('status', TransactionStatus::Pending)
    ->whereIn('type', [TransactionType::Income->value, TransactionType::Expense->value])
    ->whereNull('installment_group_id')
    // Removido: ->where('date', '>=', $today)
    ->where('date', '<', $endDate)
    ->each(function (Transaction $tx) use (&$projection, $today) {
        $txDate = Carbon::parse($tx->date);
        // Se a data for passada, agrupa no mês atual
        $key = $txDate->isBefore($today) 
            ? $today->format('Y-m') 
            : $txDate->format('Y-m');

        if (!array_key_exists($key, $projection)) return;
        // ... rest of logic
    });
```

- [ ] **Step 2: Replicar lógica para Parcelas (Installments)**

```php
// app/Services/FinancialProjectionService.php:66
Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId))
    ->where('status', TransactionStatus::Pending)
    // Removido: ->where('due_date', '>=', $today)
    ->where('due_date', '<', $endDate)
    ->each(function (Installment $installment) use (&$projection, $today) {
        $dueDate = Carbon::parse($installment->due_date);
        $key = $dueDate->isBefore($today) 
            ? $today->format('Y-m') 
            : $dueDate->format('Y-m');

        if (!array_key_exists($key, $projection)) return;
        $projection[$key]['installments'] += (float) $installment->amount;
    });
```

- [ ] **Step 3: Commit**

```bash
git add app/Services/FinancialProjectionService.php
git commit -m "fix(projection): include past pending transactions in current month projection"
```

---

### Task 4: Ajuste de Relatórios e Patrimônio Líquido

**Files:**
- Modify: `app/Http/Controllers/ReportController.php`
- Modify: `app/Services/FinancialHealthScoreService.php`

- [ ] **Step 1: Incluir parcelas pendentes na dívida total**

```php
// app/Http/Controllers/ReportController.php:79
$totalInstallmentsDebt = (float) \App\Models\Installment::whereHas('group', fn($q) => $q->where('user_id', $userId))
    ->where('status', TransactionStatus::Pending->value)
    ->sum('amount');

$totalDebt = $totalCardDebt + $totalInstallmentsDebt;
```

- [ ] **Step 2: Filtrar Transferências do Fluxo de Caixa**
Verificar se queries de `ReportController` já usam `whereIn` que exclui `transfer`. Se não, adicionar explicitamente `where('type', '!=', TransactionType::Transfer)`.

- [ ] **Step 3: Ajustar Score de Saúde Financeira**

```php
// app/Services/FinancialHealthScoreService.php
// Em scoreSavingsRate() e scoreEmergencyFund()
// Garantir que Transfer não seja contado como Income ou Expense.
// Já parece estar correto (usa explicitamente TransactionType::Income/Expense), 
// mas validar que a mudança na Task 2 não quebrou nada.
```

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/ReportController.php app/Services/FinancialHealthScoreService.php
git commit -m "fix(reports): include installments in net worth and ensure transfers are excluded from totals"
```
