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

        // 1. Transações pendentes (receita e despesa) — one-time e recorrentes.
        //    As transações filhas de séries recorrentes já existem no banco com
        //    suas datas individuais (geradas por RecurringTransactionService::createSeries),
        //    portanto basta buscá-las como qualquer outra transação pending.
        //    Não expandimos recorrências aqui para evitar dupla contagem.
        Transaction::byUser($userId)
            ->where('status', TransactionStatus::Pending)
            ->whereIn('type', [TransactionType::Income->value, TransactionType::Expense->value])
            ->whereNull('installment_group_id')
            ->where('date', '>=', $today)
            ->where('date', '<', $endDate)
            ->each(function (Transaction $tx) use (&$projection) {
                $key = Carbon::parse($tx->date)->format('Y-m');
                if (!array_key_exists($key, $projection)) return;

                if ($tx->type === TransactionType::Income) {
                    $projection[$key]['income'] += (float) $tx->amount;
                } else {
                    $projection[$key]['expense'] += (float) $tx->amount;
                }
            });

        // 2. Parcelas pendentes — agrupadas pela due_date de cada Installment
        Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId))
            ->where('status', TransactionStatus::Pending)
            ->where('due_date', '>=', $today)
            ->where('due_date', '<', $endDate)
            ->each(function (Installment $installment) use (&$projection) {
                $key = Carbon::parse($installment->due_date)->format('Y-m');
                if (!array_key_exists($key, $projection)) return;

                $projection[$key]['installments'] += (float) $installment->amount;
            });

        // 4. Transações de cartão pendentes não-parceladas
        // O mês de cobrança é calculado via CreditCard::calculateDueDate()
        Transaction::byUser($userId)
            ->where('type', TransactionType::CreditCard->value)
            ->where('status', TransactionStatus::Pending)
            ->whereNull('installment_group_id')
            ->with('creditCard')
            ->get()
            ->each(function (Transaction $tx) use (&$projection, $endDate) {
                if ($tx->creditCard) {
                    $dueDate = Carbon::instance(
                        $tx->creditCard->calculateDueDate(new DateTime((string) $tx->date))
                    );
                } else {
                    $dueDate = Carbon::parse($tx->date)->addMonth();
                }

                if ($dueDate->isBefore($endDate)) {
                    $key = $dueDate->format('Y-m');
                    if (!array_key_exists($key, $projection)) return;
                    $projection[$key]['credit_card'] += (float) $tx->amount;
                }
            });

        // 5. Calcula net e saldo acumulado partindo do saldo atual
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

    /**
     * Expande uma transação recorrente em datas futuras dentro do período.
     * Suporta recurrence_rule: 'daily', 'weekly', 'monthly' (default), 'yearly'.
     *
     * @return Carbon[]
     */
    private function expandRecurrence(Transaction $tx, Carbon $from, int $months): array
    {
        $rule    = strtolower($tx->recurrence_rule ?? 'monthly');
        $end     = $from->copy()->addMonths($months);
        $current = Carbon::parse($tx->date);

        // Avança a data original até entrar no período futuro
        while ($current->isBefore($from)) {
            $current = $this->advance($current, $rule);
        }

        $dates = [];
        while ($current->isBefore($end)) {
            $dates[] = $current->copy();
            $current = $this->advance($current, $rule);
        }

        return $dates;
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
