<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCreditCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:100'],
            'brand'           => ['nullable', 'string', 'max:30'],
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'credit_limit'    => ['required', 'numeric', 'min:0'],
            'closing_day'     => ['required', 'integer', 'min:1', 'max:31'],
            'due_day'         => ['required', 'integer', 'min:1', 'max:31'],
            'color'           => ['nullable', 'string', 'max:7'],
            'is_active'       => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'         => 'O nome do cartão é obrigatório.',
            'credit_limit.required' => 'O limite de crédito é obrigatório.',
            'credit_limit.numeric'  => 'O limite de crédito deve ser um número.',
            'closing_day.required'  => 'O dia de fechamento é obrigatório.',
            'due_day.required'      => 'O dia de vencimento é obrigatório.',
        ];
    }
}
