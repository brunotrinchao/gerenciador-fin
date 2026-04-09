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
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

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

        $response = $this->actingAs($this->user)
            ->patch(route('transactions.update', $target->id), [
                'type'             => $target->type->value,
                'description'      => 'New Description',
                'amount'           => 150.00,
                'date'             => $target->date->format('Y-m-d'),
                'status'           => $target->status->value,
                'recurrence_scope' => 'this_and_future',
            ]);

        $response->assertRedirect();

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
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

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
            ->call('DELETE', route('transactions.destroy', $transaction->id), [
                'recurrence_scope' => 'all'
            ]);

        $this->assertDatabaseMissing('installment_groups', ['id' => $group->id]);
        $this->assertDatabaseCount('installments', 0);
        $this->assertDatabaseCount('transactions', 0);
    }
}
