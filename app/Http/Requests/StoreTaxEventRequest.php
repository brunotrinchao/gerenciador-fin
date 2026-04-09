<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaxEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'               => 'required|in:ipva,iptu,irpf,other',
            'description'        => 'required|string|max:255',
            'year'               => 'required|integer|min:2020|max:2030',
            'total_amount'       => 'required|numeric|min:0.01',
            'installments_count' => 'required|integer|min:1|max:12',
            'first_due_date'     => 'required|date',
            'bank_account_id'    => 'nullable|exists:bank_accounts,id',
            'notes'              => 'nullable|string',
        ];
    }
}
