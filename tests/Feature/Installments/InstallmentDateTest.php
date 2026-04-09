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

    public function test_installment_start_on_weekend_moves_to_monday(): void
    {
        $user = User::factory()->create();
        $service = app(InstallmentService::class);

        // 2026-04-11 is a Saturday.
        // Parcela 1: 2026-04-11 (Saturday) -> Should move to 2026-04-13 (Monday)
        
        $service->create([
            'user_id'            => $user->id,
            'description'        => 'Weekend Start',
            'amount'             => 100.00,
            'total_installments' => 1,
            'start_date'         => '2026-04-11',
        ]);

        $this->assertDatabaseHas('transactions', [
            'description' => 'Weekend Start (1/1)',
            'date'        => '2026-04-13',
        ]);
    }
}
