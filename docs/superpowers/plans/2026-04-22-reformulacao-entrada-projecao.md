# Reformulação da Entrada na Projeção Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajustar a projeção para considerar saldo bancário real + apenas entradas/saídas pendentes.

**Architecture:** Refatoração do `FinancialProjectionService` para filtrar estritamente por `TransactionStatus::Pending`.

**Tech Stack:** Laravel, Eloquent, Pest PHP.

---

### Task 1: Preparação e Teste de Regressão

**Files:**
- Modify: `app/Services/FinancialProjectionService.php`
- Create/Modify: `tests/Feature/FinancialProjectionTest.php`

- [ ] **Step 1: Criar teste para validar exclusão de receitas pagas**
```php
public function test_projection_ignores_paid_income_transactions()
{
    $user = \App\Models\User::factory()->create();
    \App\Models\BankAccount::factory()->create(['user_id' => $user->id, 'current_balance' => 1000, 'active' => true]);
    
    \App\Models\Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => \App\Enums\TransactionType::Income,
        'status' => \App\Enums\TransactionStatus::Paid,
        'amount' => 500,
        'date' => now()->addDays(5)
    ]);

    $service = new \App\Services\FinancialProjectionService();
    $projection = $service->generate($user->id, 1);

    $this->assertEquals(0, $projection[0]['income']);
    $this->assertEquals(1000, $projection[0]['entrada_total']);
}
```

- [ ] **Step 2: Rodar teste e confirmar se falha (ou se já passa)**
Run: `php artisan test tests/Feature/FinancialProjectionTest.php`

- [ ] **Step 3: Ajustar query de Transações no Service**
Garantir que o filtro `Pending` está aplicado corretamente a todas as fontes de dados.
```php
// app/Services/FinancialProjectionService.php
Transaction::byUser($userId)
    ->where('status', TransactionStatus::Pending->value)
    // ...
```

- [ ] **Step 4: Commit**
```bash
git add app/Services/FinancialProjectionService.php
git commit -m "fix(projection): filter only pending transactions"
```

---

### Task 2: Validação de Saldo Inicial e Receitas Pendentes Futuras

**Files:**
- Modify: `app/Services/FinancialProjectionService.php`

- [ ] **Step 1: Adicionar teste para receitas pendentes futuras**
```php
public function test_projection_includes_pending_future_income()
{
    $user = \App\Models\User::factory()->create();
    \App\Models\BankAccount::factory()->create(['user_id' => $user->id, 'current_balance' => 1000, 'active' => true]);
    
    \App\Models\Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => \App\Enums\TransactionType::Income,
        'status' => \App\Enums\TransactionStatus::Pending,
        'amount' => 200,
        'date' => now()->addMonth(1)->startOfMonth()
    ]);

    $service = new \App\Services\FinancialProjectionService();
    $projection = $service->generate($user->id, 2);

    $this->assertEquals(200, $projection[1]['income']);
    $this->assertEquals(1200, $projection[1]['entrada_total']);
}
```

- [ ] **Step 2: Validar tratamento de pendências retroativas**
Garantir que receitas pendentes de meses passados sejam somadas ao saldo inicial do primeiro mês da projeção.

- [ ] **Step 3: Commit final**
```bash
git commit -am "feat(projection): support retro-active pending income"
```
