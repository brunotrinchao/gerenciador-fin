<?php

namespace App\Http\Requests;

use App\Enums\CategoryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'type' => ['required', Rule::enum(CategoryType::class)],
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(function ($query) {
                    return $query->where('user_id', $this->user()->id)->whereNull('parent_id');
                }),
            ],
        ];
    }
}
