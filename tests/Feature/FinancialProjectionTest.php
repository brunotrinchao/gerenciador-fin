<?php

namespace Tests\Feature;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\BankAccount;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use App\Models\User;
use App\Services\FinancialProjectionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialProjectionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private FinancialProjectionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = new FinancialProjectionService();
        
        // Create a bank account to avoid balance calculation errors if needed
        BankAccount::factory()->create([
            'user_id' => $this->user->id,
            'current_balance' => 1000,
            'is_active' => true
        ]);
    }

    public function test_projection_includes_past_pending_transactions_in_current_month(): void
    {
        $today = Carbon::today();
        $currentMonthKey = $today->format('Y-m');
        $pastDate = $today->copy()->subMonths(2);

        // Past pending income
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 500,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Pending,
            'date' => $pastDate,
        ]);

        // Past pending expense
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 200,
            'type' => TransactionType::Expense,
            'status' => TransactionStatus::Pending,
            'date' => $pastDate,
        ]);

        $projection = $this->service->generate($this->user->id, 3);

        $currentMonth = collect($projection)->firstWhere('month_key', $currentMonthKey);

        $this->assertEquals(500, $currentMonth['income'], "Past pending income should be in current month");
        $this->assertEquals(200, $currentMonth['expense'], "Past pending expense should be in current month");
    }

    public function test_projection_includes_past_pending_installments_in_current_month(): void
    {
        $today = Carbon::today();
        $currentMonthKey = $today->format('Y-m');
        $pastDate = $today->copy()->subMonths(1);

        $group = InstallmentGroup::factory()->create(['user_id' => $this->user->id]);
        
        Installment::factory()->create([
            'installment_group_id' => $group->id,
            'amount' => 150,
            'status' => TransactionStatus::Pending,
            'due_date' => $pastDate,
        ]);

        $projection = $this->service->generate($this->user->id, 3);

        $currentMonth = collect($projection)->firstWhere('month_key', $currentMonthKey);

        $this->assertEquals(150, $currentMonth['installments'], "Past pending installment should be in current month");
    }

    public function test_projection_respects_future_dates(): void
    {
        $today = Carbon::today();
        $nextMonth = $today->copy()->addMonth();
        $nextMonthKey = $nextMonth->format('Y-m');

        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 1000,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Pending,
            'date' => $nextMonth,
        ]);

        $projection = $this->service->generate($this->user->id, 3);

        $nextMonthProjection = collect($projection)->firstWhere('month_key', $nextMonthKey);

        $this->assertEquals(1000, $nextMonthProjection['income'], "Future pending income should be in its own month");
        
        $currentMonth = collect($projection)->firstWhere('month_key', $today->format('Y-m'));
        $this->assertEquals(0, $currentMonth['income'], "Future pending income should NOT be in current month");
    }

    public function test_projection_ignores_paid_income_and_investment_transactions(): void
    {
        // Paid Income
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Paid,
            'amount' => 500,
            'date' => now()->addDays(5)
        ]);

        // Paid InvestmentOut (Resgate)
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'type' => TransactionType::InvestmentOut,
            'status' => TransactionStatus::Paid,
            'amount' => 300,
            'date' => now()->addDays(6)
        ]);

        $projection = $this->service->generate($this->user->id, 1);

        $this->assertEquals(0, $projection[0]['income'], "Paid income/investment should be ignored");
        $this->assertEquals(1000, $projection[0]['entrada_total']);
    }

    public function test_projection_includes_pending_investment_out(): void
    {
        // Pending InvestmentOut (Resgate) -> Should count as income
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'type' => TransactionType::InvestmentOut,
            'status' => TransactionStatus::Pending,
            'amount' => 400,
            'date' => now()->addDays(5)
        ]);

        $projection = $this->service->generate($this->user->id, 1);

        $this->assertEquals(400, $projection[0]['income'], "Pending investment_out should be treated as income");
    }

    public function test_projection_includes_pending_future_income(): void
    {
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Pending,
            'amount' => 200,
            'date' => now()->addMonth(1)->startOfMonth()
        ]);

        $projection = $this->service->generate($this->user->id, 2);

        $this->assertEquals(200, $projection[1]['income'], "Future pending income should be in its own month");
        $this->assertEquals(1200, $projection[1]['entrada_total'], "Entrada total should accumulate from previous months");
    }

    public function test_projection_includes_retroactive_pending_income_in_first_month_balance(): void
    {
        // Past pending income
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 500,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Pending,
            'date' => now()->subMonths(1),
        ]);

        $projection = $this->service->generate($this->user->id, 1);

        // Bank balance is 1000 (from setUp)
        // Past pending income is 500
        // Total entry for first month should be 1500
        $this->assertEquals(500, $projection[0]['income']);
        $this->assertEquals(1500, $projection[0]['entrada_total'], "Retroactive pending income should be added to first month's total entry");
    }
}
