<?php

namespace Database\Factories;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'user_id'         => User::factory(),
            'bank_account_id' => null,
            'credit_card_id'  => null,
            'category_id'     => null,
            'description'     => fake()->sentence(3),
            'amount'          => fake()->randomFloat(2, 10, 5000),
            'type'            => TransactionType::Expense,
            'status'          => TransactionStatus::Pending,
            'date'            => fake()->date(),
            'is_recurring'    => false,
            'is_imported'     => false,
        ];
    }
}
