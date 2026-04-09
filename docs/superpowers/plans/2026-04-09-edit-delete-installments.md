# Edit and Delete Installments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement editing and deleting of installments with scope control (only this, this and future, all), mirroring the existing functionality for recurring transactions.

**Architecture:** Use a Service-Controller-Model pattern. Update `InstallmentService` to handle bulk updates and deletions, and modify `TransactionController` to route requests involving installments through these new service methods.

**Tech Stack:** Laravel 13, PHP 8.3, React 19, Inertia.js 3.

---

### Task 1: Update `InstallmentService`

**Files:**
- Modify: `app/Services/InstallmentService.php`

- [ ] **Step 1: Add `updateSeries` method**

```php
    /**
     * Update installment transactions based on scope.
     *
     * @param Transaction $transaction
     * @param array $data
     * @param string $scope  'only_this' | 'this_and_future' | 'all'
     */
    public function updateSeries(Transaction $transaction, array $data, string $scope): void
    {
        $groupId = $transaction->installment_group_id;
        if (!$groupId) return;

        $targets = $this->resolveTargets($transaction, $scope);

        foreach ($targets as $target) {
            $update = $data;
            
            // Do not sync date/due_date in bulk
            unset($update['date']);
            
            // Only update if not paid (protection)
            if ($scope !== 'only_this' && $target->status === \App\Enums\TransactionStatus::Paid) {
                continue;
            }

            $target->update($update);

            // Sync with Installment model if it exists
            $installment = \App\Models\Installment::where('transaction_id', $target->id)->first();
            if ($installment) {
                $instUpdate = [];
                if (isset($update['amount'])) $instUpdate['amount'] = $update['amount'];
                if (isset($update['status'])) $instUpdate['status'] = $update['status'];
                if (!empty($instUpdate)) {
                    $installment->update($instUpdate);
                }
            }
        }

        // Recalculate group total if amount changed
        if (isset($data['amount'])) {
            $group = \App\Models\InstallmentGroup::find($groupId);
            if ($group) {
                $group->update([
                    'total_amount' => \App\Models\Installment::where('installment_group_id', $groupId)->sum('amount')
                ]);
            }
        }
    }
```

- [ ] **Step 2: Add `deleteSeries` method**

```php
    /**
     * Delete installment transactions based on scope.
     *
     * @param Transaction $transaction
     * @param string $scope  'only_this' | 'this_and_future' | 'all'
     */
    public function deleteSeries(Transaction $transaction, string $scope): void
    {
        $groupId = $transaction->installment_group_id;
        if (!$groupId) return;

        $targets = $this->resolveTargets($transaction, $scope);

        foreach ($targets as $target) {
            // Delete Installment first to satisfy FK if needed (though usually cascade or soft delete)
            \App\Models\Installment::where('transaction_id', $target->id)->delete();
            $target->delete();
        }

        // If all installments are gone, delete the group
        $remaining = \App\Models\Installment::where('installment_group_id', $groupId)->count();
        if ($remaining === 0) {
            \App\Models\InstallmentGroup::find($groupId)?->delete();
        } else {
            // Update total amount
            $group = \App\Models\InstallmentGroup::find($groupId);
            if ($group) {
                $group->update([
                    'total_amount' => \App\Models\Installment::where('installment_group_id', $groupId)->sum('amount')
                ]);
            }
        }
    }
```

- [ ] **Step 3: Add `resolveTargets` helper method**

```php
    private function resolveTargets(Transaction $transaction, string $scope): \Illuminate\Support\Collection
    {
        if ($scope === 'only_this') {
            return collect([$transaction]);
        }

        $groupId = $transaction->installment_group_id;
        $currentInstallment = \App\Models\Installment::where('transaction_id', $transaction->id)->first();
        
        if (!$currentInstallment) return collect([$transaction]);

        $query = Transaction::where('installment_group_id', $groupId);

        if ($scope === 'all') {
            return $query->get();
        }

        // 'this_and_future'
        $futureTransactionIds = \App\Models\Installment::where('installment_group_id', $groupId)
            ->where('number', '>=', $currentInstallment->number)
            ->pluck('transaction_id');

        return Transaction::whereIn('id', $futureTransactionIds)->get();
    }
```

- [ ] **Step 4: Commit changes to `InstallmentService`**

```bash
git add app/Services/InstallmentService.php
git commit -m "feat: add bulk update and delete methods to InstallmentService"
```

---

### Task 2: Update `TransactionController`

**Files:**
- Modify: `app/Http/Controllers/TransactionController.php`

- [ ] **Step 1: Update `update` method**

```php
    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $data  = $request->validated();
        $scope = $data['recurrence_scope'] ?? 'only_this';
        unset($data['recurrence_scope']);

        if ($transaction->is_recurring && $scope !== 'only_this') {
            $this->recurringService->updateSeries($transaction, $data, $scope);
        } elseif ($transaction->installment_group_id && $scope !== 'only_this') {
            $this->installmentService->updateSeries($transaction, $data, $scope);
        } else {
            $transaction->update($data);
            
            // Sync single installment if exists
            if ($transaction->installment_group_id) {
                \App\Models\Installment::where('transaction_id', $transaction->id)
                    ->update([
                        'amount' => $transaction->amount,
                        'status' => $transaction->status,
                    ]);
            }
        }

        return redirect()->route('transactions.index')
            ->with('success', 'Transação atualizada com sucesso!');
    }
```

- [ ] **Step 2: Update `destroy` method**

```php
    public function destroy(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $scope = request()->input('recurrence_scope', 'only_this');

        if ($transaction->is_recurring && $scope !== 'only_this') {
            $this->recurringService->deleteSeries($transaction, $scope);
        } elseif ($transaction->installment_group_id && $scope !== 'only_this') {
            $this->installmentService->deleteSeries($transaction, $scope);
        } else {
            // Delete Installment if exists
            if ($transaction->installment_group_id) {
                \App\Models\Installment::where('transaction_id', $transaction->id)->delete();
            }
            $transaction->delete();
        }

        return redirect()->route('transactions.index')
            ->with('success', 'Transação excluída com sucesso!');
    }
```

- [ ] **Step 3: Commit changes to `TransactionController`**

```bash
git add app/Http/Controllers/TransactionController.php
git commit -m "feat: update TransactionController to handle bulk installment operations"
```

---

### Task 3: Update Frontend `Index.tsx`

**Files:**
- Modify: `resources/js/Pages/Transactions/Index.tsx`

- [ ] **Step 1: Update `openEdit` to handle installments**

Modify `openEdit` around line 1667:
```typescript
    const openEdit = (transaction: Transaction) => {
        if (transaction.is_recurring || transaction.parent_transaction_id || transaction.installment_group_id) {
            setScopeModal({ transaction, action: 'edit' });
            return;
        }
        setPrefillData(undefined);
        setPendingEditScope('');
        setEditingTransaction(transaction);
        setShowFormModal(true);
    };
```

- [ ] **Step 2: Update `handleDeleteClick` to handle installments**

Modify `handleDeleteClick` around line 1697:
```typescript
    const handleDeleteClick = (transaction: Transaction) => {
        if (transaction.is_recurring || transaction.parent_transaction_id || transaction.installment_group_id) {
            setScopeModal({ transaction, action: 'delete' });
            return;
        }
        setDeletingTransaction(transaction);
    };
```

- [ ] **Step 3: Update `RecurrenceScopeModal` for installments**

Modify `RecurrenceScopeModal` component around line 1327:
```typescript
function RecurrenceScopeModal({ transaction, action, onSelect, onClose }: RecurrenceScopeModalProps) {
    const isInstallment = !!transaction.installment_group_id;
    
    const title = action === 'edit' 
        ? (isInstallment ? 'Editar parcelas' : 'Editar transação recorrente')
        : (isInstallment ? 'Excluir parcelas' : 'Excluir transação recorrente');
        
    const description = action === 'edit'
        ? 'Escolha o escopo da edição:'
        : 'Escolha o escopo da exclusão:';

    const options = isInstallment 
        ? [
            { value: 'only_this', label: 'Só esta parcela' },
            { value: 'this_and_future', label: 'Esta e as futuras parcelas' },
            { value: 'all', label: 'Todas as parcelas do grupo' },
          ]
        : [
            { value: 'only_this', label: 'Só esta ocorrência' },
            { value: 'this_and_future', label: 'Esta e as futuras' },
            { value: 'all', label: 'Todas as ocorrências' },
          ];
    // ... rest of component
```

- [ ] **Step 4: Commit frontend changes**

```bash
git add resources/js/Pages/Transactions/Index.tsx
git commit -m "feat: update UI to handle installment scope selection"
```

---

### Task 4: Automated Testing

**Files:**
- Create: `tests/Feature/Installments/InstallmentEditTest.php`

- [ ] **Step 1: Write tests for bulk update and delete**

```php
<?php

namespace Tests\Feature\Installments;

use App\Models\CreditCard;
use App\Models\Installment;
use App\Models\Transaction;
use App\Models\User;
use App\Services\InstallmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallmentEditTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_update_this_and_future_installments(): void
    {
        $card = CreditCard::factory()->create(['user_id' => $this->user->id]);
        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Old Description',
            'amount'             => 300.00,
            'total_installments' => 3,
            'start_date'         => now()->format('Y-m-d'),
        ]);

        $transactions = Transaction::where('installment_group_id', $group->id)->orderBy('date')->get();
        $target = $transactions[1]; // Second installment

        $this->actingAs($this->user)
            ->patch(route('transactions.update', $target->id), [
                'type'             => $target->type->value,
                'description'      => 'New Description',
                'amount'           => 150.00,
                'date'             => $target->date->format('Y-m-d'),
                'status'           => $target->status->value,
                'recurrence_scope' => 'this_and_future',
            ]);

        // Check first installment (should NOT change)
        $this->assertDatabaseHas('transactions', [
            'id'          => $transactions[0]->id,
            'description' => 'Old Description (1/3)',
            'amount'      => 100.00
        ]);

        // Check second and third (SHOULD change)
        $this->assertDatabaseHas('transactions', [
            'id'          => $transactions[1]->id,
            'description' => 'New Description',
            'amount'      => 150.00
        ]);
        $this->assertDatabaseHas('transactions', [
            'id'          => $transactions[2]->id,
            'description' => 'New Description',
            'amount'      => 150.00
        ]);
    }

    public function test_can_delete_all_installments(): void
    {
        $card = CreditCard::factory()->create(['user_id' => $this->user->id]);
        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'To Delete',
            'amount'             => 100.00,
            'total_installments' => 2,
            'start_date'         => now()->format('Y-m-d'),
        ]);

        $transaction = Transaction::where('installment_group_id', $group->id)->first();

        $this->actingAs($this->user)
            ->delete(route('transactions.destroy', $transaction->id), [
                'recurrence_scope' => 'all'
            ]);

        $this->assertDatabaseMissing('installment_groups', ['id' => $group->id]);
        $this->assertDatabaseCount('installments', 0);
        $this->assertDatabaseCount('transactions', 0);
    }
}
```

- [ ] **Step 2: Run the tests**

Run: `php artisan test tests/Feature/Installments/InstallmentEditTest.php`
Expected: PASS

- [ ] **Step 3: Commit tests**

```bash
git add tests/Feature/Installments/InstallmentEditTest.php
git commit -m "test: add tests for bulk installment update and delete"
```
