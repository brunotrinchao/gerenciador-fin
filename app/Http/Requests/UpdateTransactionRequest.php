<?php

namespace App\Http\Requests;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type'            => ['required', new Enum(TransactionType::class)],
            'description'     => ['required', 'string', 'max:255'],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'date'            => ['required', 'date'],
            'status'          => ['required', new Enum(TransactionStatus::class)],
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'credit_card_id'  => ['nullable', 'exists:credit_cards,id'],
            'category_id'     => ['nullable', 'exists:categories,id'],
            'notes'                  => ['nullable', 'string', 'max:1000'],
            'recurrence_scope'       => ['nullable', 'string', 'in:only_this,this_and_future,all'],
            'recurrence_rule'        => ['nullable', 'string', 'in:weekly,biweekly,monthly,bimonthly,quarterly,semiannual,annual'],
            'recurrence_end_date'    => ['nullable', 'date'],
            'recurrence_occurrences' => ['nullable', 'integer', 'min:1', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'        => 'O tipo da transação é obrigatório.',
            'description.required' => 'A descrição é obrigatória.',
            'amount.required'      => 'O valor é obrigatório.',
            'amount.min'           => 'O valor deve ser maior que zero.',
            'date.required'        => 'A data é obrigatória.',
            'status.required'      => 'O status é obrigatório.',
        ];
    }
}
