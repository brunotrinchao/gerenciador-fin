<?php

namespace Database\Factories;

use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditCardStatement>
 */
class CreditCardStatementFactory extends Factory
{
    protected $model = CreditCardStatement::class;

    public function definition(): array
    {
        return [
            'user_id'         => User::factory(),
            'credit_card_id'  => CreditCard::factory(),
            'reference_month' => now()->format('Y-m'),
            'total_amount'    => fake()->randomFloat(2, 100, 5000),
            'paid_amount'     => 0,
            'status'          => 'open',
            'import_status'   => 'processing',
            'imported_at'     => now(),
        ];
    }
}
