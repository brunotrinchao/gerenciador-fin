<?php

namespace Database\Factories;

use App\Enums\InstallmentStatus;
use App\Models\InstallmentGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstallmentGroup>
 */
class InstallmentGroupFactory extends Factory
{
    protected $model = InstallmentGroup::class;

    public function definition(): array
    {
        $n      = fake()->numberBetween(2, 12);
        $total  = fake()->randomFloat(2, 100, 5000);
        $amount = round($total / $n, 2);

        return [
            'user_id'            => User::factory(),
            'credit_card_id'     => null,
            'bank_account_id'    => null,
            'category_id'        => null,
            'description'        => fake()->sentence(3),
            'total_amount'       => $total,
            'installment_amount' => $amount,
            'total_installments' => $n,
            'paid_installments'  => 0,
            'start_date'         => fake()->date(),
            'status'             => InstallmentStatus::Active,
        ];
    }
}
