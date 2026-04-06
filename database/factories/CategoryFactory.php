<?php

namespace Database\Factories;

use App\Enums\CategoryType;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'user_id'    => null,
            'name'       => fake()->word(),
            'icon'       => 'tag',
            'color'      => '#3b82f6',
            'type'       => CategoryType::Expense,
            'parent_id'  => null,
            'is_default' => false,
        ];
    }
}
