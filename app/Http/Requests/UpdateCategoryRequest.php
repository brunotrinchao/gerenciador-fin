<?php

namespace App\Http\Requests;

use App\Enums\CategoryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Certifica que a categoria pertence ao usuário e que não é uma categoria padrão (is_default).
        // Na verdade, talvez o admin/usuário não deva editar as default, mas deixaremos a restrição no Controller ou aqui.
        $category = $this->route('category');
        return $category && $category->user_id === $this->user()->id && !$category->is_default;
    }

    public function rules(): array
    {
        $category = $this->route('category');

        return [
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'type' => ['required', Rule::enum(CategoryType::class)],
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(function ($query) use ($category) {
                    return $query->where('user_id', $this->user()->id)
                        ->whereNull('parent_id')
                        ->where('id', '!=', $category->id);
                }),
            ],
        ];
    }
}
