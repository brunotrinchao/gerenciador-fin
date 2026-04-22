<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\BankAccount;
use App\Models\Installment;
use App\Models\Transaction;
use Carbon\Carbon;
use DateTime;

class FinancialProjectionService
{
    /**
     * Gera a projeção de fluxo de caixa para os próximos $months meses.
     * Considera: transações pendentes, recorrências, parcelas e faturas de cartão.
     */
    public function generate(int $userId, int $months = 12): array
    {
        $today   = Carbon::today();
        $endDate = $today->copy()->addMonths($months);

        // Inicializa estrutura mensal
        $projection = [];
        for ($i = 0; $i < $months; $i++) {
            $month = $today->copy()->startOfMonth()->addMonths($i);
            $key   = $month->format('Y-m');

            $projection[$key] = [
                'month_key'    => $key,
                'income'       => 0.0,
                'expense'      => 0.0,
                'installments' => 0.0,
                'credit_card'  => 0.0,
                'net'          => 0.0,
                'balance'      => 0.0,
            ];
        }

        // 1. Transações pendentes (receita e despesa)
        Transaction::byUser($userId)
            ->where('status', TransactionStatus::Pending->value)
            ->whereIn('type', [TransactionType::Income->value, TransactionType::Expense->value])
            ->whereNull('installment_group_id')
            ->where('date', '<', $endDate)
            ->each(function (Transaction $tx) use (&$projection, $today) {
                $txDate = Carbon::parse($tx->date);
                // Se data for passada ou hoje, agrupa no mês atual
                $key = $txDate->isBefore($today) ? $today->format('Y-m') : $txDate->format('Y-m');

                if (!array_key_exists($key, $projection)) return;

                if ($tx->type->value === TransactionType::Income->value) {
                    $projection[$key]['income'] += (float) $tx->amount;
                } else {
                    $projection[$key]['expense'] += (float) $tx->amount;
                }
            });

        // 2. Parcelas pendentes
        Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId))
            ->where('status', TransactionStatus::Pending->value)
            ->where('due_date', '<', $endDate)
            ->each(function (Installment $installment) use (&$projection, $today) {
                $dueDate = Carbon::parse($installment->due_date);
                $key     = $dueDate->isBefore($today) ? $today->format('Y-m') : $dueDate->format('Y-m');

                if (!array_key_exists($key, $projection)) return;

                $projection[$key]['installments'] += (float) $installment->amount;
            });

        // 3. Transações de cartão pendentes
        Transaction::byUser($userId)
            ->where('type', TransactionType::CreditCard->value)
            ->where('status', TransactionStatus::Pending->value)
            ->whereNull('installment_group_id')
            ->with('creditCard')
            ->get()
            ->each(function (Transaction $tx) use (&$projection, $endDate, $today) {
                if ($tx->creditCard) {
                    $dueDate = Carbon::instance(
                        $tx->creditCard->calculateDueDate(new DateTime((string) $tx->date))
                    );
                } else {
                    $dueDate = Carbon::parse($tx->date)->addMonth();
                }

                if ($dueDate->isBefore($endDate)) {
                    $key = $dueDate->isBefore($today) ? $today->format('Y-m') : $dueDate->format('Y-m');
                    if (!array_key_exists($key, $projection)) return;
                    $projection[$key]['credit_card'] += (float) $tx->amount;
                }
            });

        // 4. Calcula acumulado partindo do saldo atual
        $runningBalance = (float) BankAccount::byUser($userId)->active()->sum('current_balance');

        foreach ($projection as &$month) {
            $totalOut         = $month['expense'] + $month['installments'] + $month['credit_card'];
            $month['net']     = round($month['income'] - $totalOut, 2);
            $runningBalance  += $month['net'];
            $month['balance'] = round($runningBalance, 2);

            $month['income']       = round($month['income'], 2);
            $month['expense']      = round($month['expense'], 2);
            $month['installments'] = round($month['installments'], 2);
            $month['credit_card']  = round($month['credit_card'], 2);
        }

        return array_values($projection);
    }

    private function advance(Carbon $date, string $rule): Carbon
    {
        return match ($rule) {
            'daily'      => $date->copy()->addDay(),
            'weekly'     => $date->copy()->addDays(7),
            'biweekly'   => $date->copy()->addDays(14),
            'bimonthly'  => $date->copy()->addMonths(2),
            'quarterly'  => $date->copy()->addMonths(3),
            'semiannual' => $date->copy()->addMonths(6),
            'annual'     => $date->copy()->addYear(),
            default      => $date->copy()->addMonth(),
        };
    }
}
