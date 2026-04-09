<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\TaxEvent;
use App\Models\Transaction;
use App\Models\User;

class TaxPlanningService
{
    public function createWithTransactions(array $data, User $user): TaxEvent
    {
        $taxEvent = TaxEvent::create([...$data, 'user_id' => $user->id]);

        $count  = $taxEvent->installments_count;
        $amount = round($taxEvent->total_amount / $count, 2);
        $last   = round($taxEvent->total_amount - ($amount * ($count - 1)), 2);

        for ($i = 0; $i < $count; $i++) {
            $parcela = ($i === $count - 1) ? $last : $amount;
            Transaction::create([
                'user_id'         => $user->id,
                'bank_account_id' => $taxEvent->bank_account_id,
                'description'     => $taxEvent->description . ($count > 1 ? ' (' . ($i + 1) . '/' . $count . ')' : ''),
                'amount'          => $parcela,
                'type'            => TransactionType::Expense,
                'status'          => TransactionStatus::Scheduled,
                'date'            => $taxEvent->first_due_date->copy()->addMonths($i),
            ]);
        }

        return $taxEvent;
    }
}
