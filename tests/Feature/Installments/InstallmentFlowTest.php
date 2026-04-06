<?php

namespace Tests\Feature\Installments;

use App\Enums\InstallmentStatus;
use App\Enums\TransactionStatus;
use App\Models\BankAccount;
use App\Models\CreditCard;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use App\Models\User;
use App\Services\InstallmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallmentFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // ─────────────────────────────────────────────
    // InstallmentService::create
    // ─────────────────────────────────────────────

    public function test_creates_installment_group_with_correct_counts(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Notebook',
            'amount'       => 1200.00,
            'total_installments' => 12,
            'start_date'         => '2026-01-10',
        ]);
dd($group);
        $this->assertInstanceOf(InstallmentGroup::class, $group);
        $this->assertEquals(12, $group->total_installments);
        $this->assertEquals('1200.00', $group->total_amount);
        $this->assertDatabaseCount('installment_groups', 1);
        $this->assertDatabaseCount('installments', 12);
        $this->assertDatabaseCount('transactions', 12);
    }

    public function test_rounding_goes_to_last_installment(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Compra parcelada',
            'total_amount'       => 100.00,
            'total_installments' => 3,
            'start_date'         => '2026-01-10',
        ]);

        $installments = Installment::where('installment_group_id', $group->id)
            ->orderBy('number')
            ->get();

        // 100 / 3 = 33.33 each, last = 33.34
        $this->assertEquals('33.33', $installments[0]->amount);
        $this->assertEquals('33.33', $installments[1]->amount);
        $this->assertEquals('33.34', $installments[2]->amount);

        $summed = $installments->sum(fn ($i) => (float) $i->amount);
        $this->assertEquals(100.00, $summed);
    }

    public function test_installments_are_created_as_pending(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'TV',
            'total_amount'       => 600.00,
            'total_installments' => 6,
            'start_date'         => '2026-01-10',
        ]);

        $statuses = Installment::where('installment_group_id', $group->id)
            ->pluck('status')
            ->map(fn ($s) => $s instanceof TransactionStatus ? $s->value : $s)
            ->toArray();

        $this->assertCount(6, array_filter($statuses, fn ($s) => $s === 'pending'));
    }

    public function test_due_dates_are_sequential_months(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 15,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Geladeira',
            'total_amount'       => 300.00,
            'total_installments' => 3,
            'start_date'         => '2026-01-05', // before closing_day=20, so first due = Feb 15
        ]);

        $dueDates = Installment::where('installment_group_id', $group->id)
            ->orderBy('number')
            ->pluck('due_date')
            ->map(fn ($d) => $d->format('Y-m'))
            ->toArray();

        // Each due date should be one month apart
        $this->assertCount(3, $dueDates);
        $this->assertEquals('2026-02', $dueDates[0]);
        $this->assertEquals('2026-03', $dueDates[1]);
        $this->assertEquals('2026-04', $dueDates[2]);
    }

    // ─────────────────────────────────────────────
    // HTTP: InstallmentGroupController
    // ─────────────────────────────────────────────

    public function test_store_via_http_creates_installment_group(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $this->actingAs($this->user)
            ->post(route('installments.store'), [
                'credit_card_id'     => $card->id,
                'description'        => 'Smartphone',
                'total_amount'       => 2400.00,
                'total_installments' => 12,
                'start_date'         => '2026-01-10',
            ])
            ->assertRedirect(route('installments.index'));

        $this->assertDatabaseHas('installment_groups', [
            'user_id'     => $this->user->id,
            'description' => 'Smartphone',
        ]);
        $this->assertDatabaseCount('installments', 12);
    }

    public function test_guest_cannot_store_installment(): void
    {
        $this->post(route('installments.store'), [
            'description'        => 'Test',
            'total_amount'       => 100,
            'total_installments' => 2,
            'start_date'         => '2026-01-10',
        ])->assertRedirect('/login');
    }

    public function test_destroy_cancels_pending_installments(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Sofa',
            'total_amount'       => 500.00,
            'total_installments' => 5,
            'start_date'         => '2026-01-10',
        ]);

        $this->actingAs($this->user)
            ->delete(route('installments.destroy', $group->id))
            ->assertRedirect(route('installments.index'));

        $group->refresh();
        $this->assertEquals(InstallmentStatus::Cancelled, $group->status);

        $pending = Installment::where('installment_group_id', $group->id)
            ->where('status', 'pending')
            ->count();
        $this->assertEquals(0, $pending);
    }

    public function test_user_cannot_delete_another_users_installment_group(): void
    {
        $otherUser = User::factory()->create();
        $card = CreditCard::factory()->create([
            'user_id'         => $otherUser->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $otherUser->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Mesa',
            'total_amount'       => 200.00,
            'total_installments' => 2,
            'start_date'         => '2026-01-10',
        ]);

        $this->actingAs($this->user)
            ->delete(route('installments.destroy', $group->id))
            ->assertStatus(403);
    }

    // ─────────────────────────────────────────────
    // HTTP: InstallmentController::markAsPaid
    // ─────────────────────────────────────────────

    public function test_mark_installment_as_paid(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Livros',
            'total_amount'       => 120.00,
            'total_installments' => 3,
            'start_date'         => '2026-01-10',
        ]);

        $installment = Installment::where('installment_group_id', $group->id)
            ->where('number', 1)
            ->first();

        $this->actingAs($this->user)
            ->patch(route('installments.pay', $installment->id))
            ->assertRedirect();

        $installment->refresh();
        $this->assertEquals(TransactionStatus::Paid, $installment->status);
        $this->assertNotNull($installment->paid_at);
    }

    public function test_user_cannot_pay_another_users_installment(): void
    {
        $otherUser = User::factory()->create();
        $card = CreditCard::factory()->create([
            'user_id'         => $otherUser->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $otherUser->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Cadeira',
            'total_amount'       => 240.00,
            'total_installments' => 2,
            'start_date'         => '2026-01-10',
        ]);

        $installment = Installment::where('installment_group_id', $group->id)->first();

        $this->actingAs($this->user)
            ->patch(route('installments.pay', $installment->id))
            ->assertStatus(403);
    }

    // ─────────────────────────────────────────────
    // InstallmentGroup accessors
    // ─────────────────────────────────────────────

    public function test_progress_attribute_returns_correct_percentage(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Monitor',
            'total_amount'       => 400.00,
            'total_installments' => 4,
            'start_date'         => '2026-01-10',
        ]);

        $group->update(['paid_installments' => 2]);
        $group->refresh();

        $this->assertEquals(50.0, $group->progress);
    }

    public function test_total_remaining_attribute(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $service = app(InstallmentService::class);
        $group = $service->create([
            'user_id'            => $this->user->id,
            'credit_card_id'     => $card->id,
            'description'        => 'Celular',
            'total_amount'       => 1200.00,
            'total_installments' => 12,
            'start_date'         => '2026-01-10',
        ]);

        $group->update(['paid_installments' => 3]);
        $group->refresh();

        // 9 remaining * 100 = 900
        $this->assertEquals(900.0, $group->total_remaining);
    }
}
