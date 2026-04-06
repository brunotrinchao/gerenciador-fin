<?php

namespace App\Http\Requests;

use App\Enums\AccountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_code' => ['nullable', 'string', 'max:10'],
            'account_type' => ['required', new Enum(AccountType::class)],
            'initial_balance' => ['required', 'numeric'],
            'overdraft_limit' => ['nullable', 'numeric', 'min:0'],
            'color' => ['nullable', 'string', 'max:7'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome da conta é obrigatório.',
            'account_type.required' => 'O tipo de conta é obrigatório.',
            'initial_balance.required' => 'O saldo inicial é obrigatório.',
            'initial_balance.numeric' => 'O saldo inicial deve ser um número.',
        ];
    }
}
