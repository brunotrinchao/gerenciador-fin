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
     */
    public function generate(int $userId, int $months = 12): array
    {
        $today = Carbon::today();
        $endDate = $today->copy()->addMonths($months);

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
                'resultado'    => 0.0,
                'entrada_total'=> 0.0,
                'balance'      => 0.0,
            ];
        }

        // 1. Receitas e Despesas (Pendentes)
        Transaction::byUser($userId)
            ->where('status', TransactionStatus::Pending->value)
            ->whereIn('type', [
                TransactionType::Income->value, 
                TransactionType::Expense->value,
                TransactionType::InvestmentIn->value,
                TransactionType::InvestmentOut->value
            ])
            ->whereNull('installment_group_id')
            ->where('date', '<', $endDate)
            ->each(function (Transaction $tx) use (&$projection, $today) {
                $txDate = Carbon::parse($tx->date);
                $key = $txDate->isBefore($today) ? $today->format('Y-m') : $txDate->format('Y-m');
                if (!array_key_exists($key, $projection)) return;

                if (in_array($tx->type->value, [TransactionType::Income->value, TransactionType::InvestmentOut->value])) {
                    $projection[$key]['income'] += (float) $tx->amount;
                } else {
                    $projection[$key]['expense'] += (float) $tx->amount;
                }
            });

        // 2. Parcelas PENDENTES
        Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId))
            ->with('group')
            ->where('status', TransactionStatus::Pending->value)
            ->where('due_date', '<', $endDate)
            ->each(function (Installment $installment) use (&$projection, $today) {
                $dueDate = Carbon::parse($installment->due_date);
                $key     = $dueDate->isBefore($today) ? $today->format('Y-m') : $dueDate->format('Y-m');
                if (!array_key_exists($key, $projection)) return;

                if ($installment->group->credit_card_id) {
                    $projection[$key]['credit_card'] += (float) $installment->amount;
                } else {
                    $projection[$key]['installments'] += (float) $installment->amount;
                }
            });

        // 3. Cartão PENDENTE
        Transaction::byUser($userId)
            ->where('type', TransactionType::CreditCard->value)
            ->where('status', TransactionStatus::Pending->value)
            ->whereNull('installment_group_id')
            ->with('creditCard')
            ->get()
            ->each(function (Transaction $tx) use (&$projection, $endDate, $today) {
                if ($tx->creditCard) {
                    $dueDate = Carbon::instance($tx->creditCard->calculateDueDate(new DateTime((string) $tx->date)));
                } else {
                    $dueDate = Carbon::parse($tx->date)->addMonth();
                }
                if ($dueDate->isBefore($endDate)) {
                    $key = $dueDate->isBefore($today) ? $today->format('Y-m') : $dueDate->format('Y-m');
                    if (array_key_exists($key, $projection)) {
                        $projection[$key]['credit_card'] += (float) $tx->amount;
                    }
                }
            });

        // ─── LÓGICA ACUMULATIVA ───
        
        // Base: Saldo Real Hoje
        $prevBalance = (float) BankAccount::byUser($userId)->active()->sum('current_balance');

        foreach ($projection as &$month) {
            // Resultado = Soma de saídas previstas do mês
            $month['resultado'] = round($month['expense'] + $month['installments'] + $month['credit_card'], 2);
            
            // Entrada Total = Saldo Acumulado + Receitas do Mês
            $month['entrada_total'] = round($prevBalance + $month['income'], 2);
            
            // Saldo Projetado = Entrada Total - Resultado
            $month['balance'] = round($month['entrada_total'] - $month['resultado'], 2);

            // Passa saldo para o próximo mês
            $prevBalance = $month['balance'];

            $month['income']       = round($month['income'], 2);
            $month['expense']      = round($month['expense'], 2);
            $month['installments'] = round($month['installments'], 2);
            $month['credit_card']  = round($month['credit_card'], 2);
        }

        return array_values($projection);
    }
}
