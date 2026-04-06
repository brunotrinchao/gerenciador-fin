<?php

namespace App\Http\Requests;

use App\Enums\InvestmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreInvestmentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:100'],
            'type'             => ['required', new Enum(InvestmentType::class)],
            'institution'      => ['nullable', 'string', 'max:100'],
            'bank_account_id'  => ['nullable', 'exists:bank_accounts,id'],
            'invested_amount'  => ['required', 'numeric', 'min:0.01'],
            'current_amount'   => ['nullable', 'numeric', 'min:0'],
            'yield_rate'       => ['nullable', 'numeric', 'min:0'],
            'yield_type'       => ['nullable', 'in:prefixado,posfixado,hibrido'],
            'start_date'       => ['required', 'date'],
            'maturity_date'    => ['nullable', 'date', 'after:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'            => 'O nome do investimento é obrigatório.',
            'type.required'            => 'O tipo de investimento é obrigatório.',
            'invested_amount.required' => 'O valor investido é obrigatório.',
            'start_date.required'      => 'A data de início é obrigatória.',
        ];
    }
}
