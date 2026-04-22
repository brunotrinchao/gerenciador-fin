<?php

namespace Tests\Feature;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTaskTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Force SQLite for this test if needed, though phpunit.xml should handle it
    }

    public function test_net_worth_includes_pending_installments()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Bank balance
        BankAccount::factory()->create([
            'user_id' => $user->id,
            'current_balance' => 1000,
        ]);

        // Pending Credit Card transaction (already included before)
        Transaction::factory()->create([
            'user_id' => $user->id,
            'type' => TransactionType::CreditCard,
            'status' => TransactionStatus::Pending,
            'amount' => 100,
        ]);

        // Pending Installment (NOT included before, SHOULD be included now)
        $group = InstallmentGroup::factory()->create([
            'user_id' => $user->id,
            'total_amount' => 500,
        ]);
        
        Transaction::factory()->create([
            'user_id' => $user->id,
            'type' => TransactionType::Expense,
            'status' => TransactionStatus::Pending,
            'amount' => 250,
            'installment_group_id' => $group->id,
        ]);

        $response = $this->get(route('reports.index'));

        $response->assertStatus(200);
        $netWorth = $response->viewData('netWorth');
        
        // bank(1000) - credit_card(100) - installment(250) = 650
        $this->assertEquals(1000, $netWorth['bank_balance']);
        $this->assertEquals(350, $netWorth['debt']); // 100 + 250
        $this->assertEquals(650, $netWorth['total']);
    }

    public function test_cash_flow_and_category_reports_exclude_transfers()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Food']);

        // Income
        Transaction::factory()->create([
            'user_id' => $user->id,
            'type' => TransactionType::Income,
            'status' => TransactionStatus::Paid,
            'amount' => 2000,
            'date' => now(),
        ]);

        // Expense
        Transaction::factory()->create([
            'user_id' => $user->id,
            'type' => TransactionType::Expense,
            'status' => TransactionStatus::Paid,
            'amount' => 500,
            'category_id' => $category->id,
            'date' => now(),
        ]);

        // Transfer (SHOULD BE EXCLUDED)
        Transaction::factory()->create([
            'user_id' => $user->id,
            'type' => TransactionType::Transfer,
            'status' => TransactionStatus::Paid,
            'amount' => 300,
            'date' => now(),
        ]);

        $response = $this->get(route('reports.index'));

        $response->assertStatus(200);
        
        $cashFlow = collect($response->viewData('cashFlow'))->firstWhere('month_key', now()->format('Y-m'));
        $this->assertEquals(2000, $cashFlow['income']);
        $this->assertEquals(500, $cashFlow['expense']);

        $expensesByCategory = collect($response->viewData('expensesByCategory'));
        $this->assertEquals(1, $expensesByCategory->count());
        $this->assertEquals(500, $expensesByCategory->first()['value']);
    }
}
