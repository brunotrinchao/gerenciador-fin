# Adjust Installment Date Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify installment creation logic so that the first installment starts exactly on the provided date, subsequent installments follow monthly, and weekend dates are moved to the next Monday.

**Architecture:** Update `InstallmentService::create` to use the input start date as the foundation for all installments, incrementing months and applying a weekend adjustment helper.

**Tech Stack:** Laravel 13, PHP 8.3, Carbon.

---

### Task 1: Update `InstallmentService`

**Files:**
- Modify: `app/Services/InstallmentService.php`

- [ ] **Step 1: Add `adjustForWeekend` private method**

```php
    private function adjustForWeekend(Carbon $date): Carbon
    {
        if ($date->isWeekend()) {
            return $date->next(Carbon::MONDAY);
        }
        return $date;
    }
```

- [ ] **Step 2: Refactor `create` method to use new date logic**

```php
    public function create(array $data): InstallmentGroup
    {
        // ... (existing totalAmount and group creation)
        
        $baseDate = Carbon::parse($data['start_date']);

        // ... (existing txType detection)

        for ($i = 1; $i <= $n; $i++) {
            $amount = ($i === $n) ? $lastAmount : $installmentAmount;

            // Calculate expected date
            $dueDate = $baseDate->copy()->addMonthsNoOverflow($i - 1);
            
            // Apply weekend adjustment
            $dueDate = $this->adjustForWeekend($dueDate);

            // ... (rest of transaction and installment creation)
        }

        return $group;
    }
```

- [ ] **Step 3: Commit changes**

```bash
git add app/Services/InstallmentService.php
git commit -m "feat: adjust installment dates to start on input date and avoid weekends"
```

---

### Task 2: Update Projections (If needed)

**Files:**
- Check: `app/Services/FinancialProjectionService.php`

- [ ] **Step 1: Verify if projections still work correctly**
Projections already use `calculateDueDate($tx->date)`, so they should now correctly pick up the installment dates.

---

### Task 3: Verification with Tests

**Files:**
- Create: `tests/Feature/Installments/InstallmentDateTest.php`

- [ ] **Step 1: Write test for weekend adjustment and monthly sequence**

```php
<?php

namespace Tests\Feature\Installments;

use App\Models\User;
use App\Services\InstallmentService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallmentDateTest extends TestCase
{
    use RefreshDatabase;

    public function test_installment_dates_avoid_weekends_and_start_on_input_date(): void
    {
        $user = User::factory()->create();
        $service = app(InstallmentService::class);

        // 2026-04-10 is a Friday.
        // Parcela 1: 2026-04-10 (Friday)
        // Parcela 2: 2026-05-10 (Sunday) -> Should move to 2026-05-11 (Monday)
        
        $service->create([
            'user_id'            => $user->id,
            'description'        => 'Test Installments',
            'amount'             => 200.00,
            'total_installments' => 2,
            'start_date'         => '2026-04-10',
        ]);

        $this->assertDatabaseHas('transactions', [
            'description' => 'Test Installments (1/2)',
            'date'        => '2026-04-10',
        ]);

        $this->assertDatabaseHas('transactions', [
            'description' => 'Test Installments (2/2)',
            'date'        => '2026-05-11', // Moved from Sunday 10th to Monday 11th
        ]);
    }
}
```

- [ ] **Step 2: Run tests**

```bash
php artisan test tests/Feature/Installments/InstallmentDateTest.php
```

- [ ] **Step 3: Commit tests**

```bash
git add tests/Feature/Installments/InstallmentDateTest.php
git commit -m "test: verify installment date logic and weekend adjustment"
```
