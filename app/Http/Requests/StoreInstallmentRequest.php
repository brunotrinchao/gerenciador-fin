<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstallmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description'        => ['required', 'string', 'max:255'],
            'total_amount'       => ['required', 'numeric', 'min:0.01'],
            'total_installments' => ['required', 'integer', 'min:2', 'max:120'],
            'start_date'         => ['required', 'date'],
            'credit_card_id'     => ['nullable', 'exists:credit_cards,id'],
            'bank_account_id'    => ['nullable', 'exists:bank_accounts,id'],
            'category_id'        => ['nullable', 'exists:categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'description.required'        => 'A descrição é obrigatória.',
            'total_amount.required'       => 'O valor total é obrigatório.',
            'total_amount.numeric'        => 'O valor total deve ser um número.',
            'total_amount.min'            => 'O valor total deve ser maior que zero.',
            'total_installments.required' => 'O número de parcelas é obrigatório.',
            'total_installments.min'      => 'O número de parcelas deve ser no mínimo 2.',
            'total_installments.max'      => 'O número de parcelas não pode exceder 120.',
            'start_date.required'         => 'A data de início é obrigatória.',
        ];
    }
}
