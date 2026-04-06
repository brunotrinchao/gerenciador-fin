<?php

namespace Database\Factories;

use App\Enums\AccountType;
use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BankAccount>
 */
class BankAccountFactory extends Factory
{
    protected $model = BankAccount::class;

    public function definition(): array
    {
        return [
            'user_id'         => User::factory(),
            'name'            => fake()->company() . ' Conta',
            'bank_name'       => fake()->company(),
            'bank_code'       => fake()->numerify('###'),
            'account_type'    => AccountType::Checking,
            'initial_balance' => fake()->randomFloat(2, 0, 10000),
            'current_balance' => fake()->randomFloat(2, 0, 10000),
            'overdraft_limit' => 0,
            'color'           => '#22c55e',
            'is_active'       => true,
        ];
    }
}
