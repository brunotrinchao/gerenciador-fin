<?php

namespace App\Services;

use App\Enums\InstallmentStatus;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\CreditCard;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use DateTime;

class InstallmentService
{
    public function create(array $data): InstallmentGroup
    {
        
        $totalAmount       = (float) $data['amount'];
        $n                 = (int) $data['total_installments'];
        $installmentAmount = round($totalAmount / $n, 2);
        // Diferença de arredondamento vai na última parcela
        $lastAmount        = round($totalAmount - ($installmentAmount * ($n - 1)), 2);

        $group = InstallmentGroup::create([
            'user_id'            => $data['user_id'],
            'credit_card_id'     => $data['credit_card_id'] ?? null,
            'bank_account_id'    => $data['bank_account_id'] ?? null,
            'category_id'        => $data['category_id'] ?? null,
            'description'        => $data['description'],
            'total_amount'       => $totalAmount,
            'installment_amount' => $installmentAmount,
            'total_installments' => $n,
            'paid_installments'  => 0,
            'start_date'         => $data['start_date'],
            'status'             => InstallmentStatus::Active,
        ]);

        $purchaseDate = new DateTime($data['start_date']);

        if (! empty($data['credit_card_id'])) {
            $card     = CreditCard::findOrFail($data['credit_card_id']);
            $firstDue = $card->calculateDueDate($purchaseDate);
        } else {
            // Débito direto: vence no mesmo dia do mês seguinte
            $firstDue = clone $purchaseDate;
            // $firstDue->modify('first day of next month');
            $firstDue->setDate(
                (int) $firstDue->format('Y'),
                (int) $firstDue->format('m'),
                (int) $purchaseDate->format('d')
            );
        }

        $txType = ! empty($data['credit_card_id'])
            ? TransactionType::CreditCard
            : TransactionType::Expense;

        for ($i = 1; $i <= $n; $i++) {
            $amount = ($i === $n) ? $lastAmount : $installmentAmount;

            $dueDate = clone $firstDue;
            if ($i > 1) {
                $dueDate->modify('+' . ($i - 1) . ' months');
            }

            $transaction = Transaction::create([
                'user_id'              => $data['user_id'],
                'bank_account_id'      => $data['bank_account_id'] ?? null,
                'credit_card_id'       => $data['credit_card_id'] ?? null,
                'category_id'          => $data['category_id'] ?? null,
                'installment_group_id' => $group->id,
                'description'          => $data['description'] . " ({$i}/{$n})",
                'amount'               => $amount,
                'type'                 => $txType,
                'status'               => TransactionStatus::Pending,
                'date'                 => $dueDate->format('Y-m-d'),
            ]);

            Installment::create([
                'installment_group_id' => $group->id,
                'transaction_id'       => $transaction->id,
                'number'               => $i,
                'amount'               => $amount,
                'due_date'             => $dueDate->format('Y-m-d'),
                'status'               => TransactionStatus::Pending,
            ]);
        }

        return $group;
    }
}
