<?php

namespace Database\Factories;

use App\Models\CreditCard;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditCard>
 */
class CreditCardFactory extends Factory
{
    protected $model = CreditCard::class;

    public function definition(): array
    {
        $limit = fake()->randomFloat(2, 1000, 20000);

        return [
            'user_id'          => User::factory(),
            'bank_account_id'  => null,
            'name'             => fake()->company() . ' Card',
            'brand'            => fake()->randomElement(['Visa', 'Mastercard', 'Elo']),
            'last_four_digits' => fake()->numerify('####'),
            'credit_limit'     => $limit,
            'available_limit'  => $limit,
            'closing_day'      => fake()->numberBetween(1, 28),
            'due_day'          => fake()->numberBetween(1, 28),
            'color'            => '#6366f1',
            'is_active'        => true,
        ];
    }
}
