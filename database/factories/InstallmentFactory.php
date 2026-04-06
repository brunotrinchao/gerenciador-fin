<?php

namespace Database\Factories;

use App\Enums\TransactionStatus;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Installment>
 */
class InstallmentFactory extends Factory
{
    protected $model = Installment::class;

    public function definition(): array
    {
        return [
            'installment_group_id' => InstallmentGroup::factory(),
            'transaction_id'       => null,
            'number'               => fake()->numberBetween(1, 12),
            'amount'               => fake()->randomFloat(2, 10, 500),
            'due_date'             => fake()->date(),
            'status'               => TransactionStatus::Pending,
        ];
    }
}
