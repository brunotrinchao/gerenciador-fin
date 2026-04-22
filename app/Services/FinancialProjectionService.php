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
        $startOfMonth = $today->copy()->startOfMonth();
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
                'installments' => 0.0, // Apenas parcelas SEM cartão
                'credit_card'  => 0.0, // Faturas + Parcelas de cartão
                'net'          => 0.0,
                'balance'      => 0.0,
            ];
        }

        // 1. Receitas e Despesas (Pago + Pendente)
        Transaction::byUser($userId)
            ->whereIn('status', [TransactionStatus::Paid->value, TransactionStatus::Pending->value])
            ->whereIn('type', [TransactionType::Income->value, TransactionType::Expense->value])
            ->whereNull('installment_group_id')
            ->where('date', '>=', $startOfMonth)
            ->where('date', '<', $endDate)
            ->each(function (Transaction $tx) use (&$projection) {
                $key = Carbon::parse($tx->date)->format('Y-m');
                if (!array_key_exists($key, $projection)) return;

                if ($tx->type->value === TransactionType::Income->value) {
                    $projection[$key]['income'] += (float) $tx->amount;
                } else {
                    $projection[$key]['expense'] += (float) $tx->amount;
                }
            });

        // 2. Parcelas (Boleto/Cartão) (Pago + Pendente)
        Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId))
            ->with('group')
            ->whereIn('status', [TransactionStatus::Paid->value, TransactionStatus::Pending->value])
            ->where('due_date', '>=', $startOfMonth)
            ->where('due_date', '<', $endDate)
            ->each(function (Installment $installment) use (&$projection) {
                $key = Carbon::parse($installment->due_date)->format('Y-m');
                if (!array_key_exists($key, $projection)) return;

                if ($installment->group->credit_card_id) {
                    $projection[$key]['credit_card'] += (float) $installment->amount;
                } else {
                    $projection[$key]['installments'] += (float) $installment->amount;
                }
            });

        // 3. Faturas de Cartão (Pago + Pendente)
        Transaction::byUser($userId)
            ->where('type', TransactionType::CreditCard->value)
            ->whereIn('status', [TransactionStatus::Paid->value, TransactionStatus::Pending->value])
            ->whereNull('installment_group_id')
            ->with('creditCard')
            ->get()
            ->each(function (Transaction $tx) use (&$projection, $endDate) {
                if ($tx->creditCard) {
                    $dueDate = Carbon::instance($tx->creditCard->calculateDueDate(new DateTime((string) $tx->date)));
                } else {
                    $dueDate = Carbon::parse($tx->date)->addMonth();
                }

                $key = $dueDate->format('Y-m');
                if ($dueDate->isBefore($endDate) && array_key_exists($key, $projection)) {
                    $projection[$key]['credit_card'] += (float) $tx->amount;
                }
            });

        // ─── CÁLCULO DO SALDO ACUMULADO ───

        // Saldo real nas contas HOJE
        $currentBalance = (float) BankAccount::byUser($userId)->active()->sum('current_balance');

        // Para somar tudo que é do mês (incluindo o que já foi pago), recuamos o saldo pro início do mês.
        $paidIncomeThisMonth = Transaction::byUser($userId)
            ->where('status', TransactionStatus::Paid->value)
            ->whereIn('type', [TransactionType::Income->value, TransactionType::InvestmentOut->value])
            ->whereMonth('date', $today->month)
            ->whereYear('date', $today->year)
            ->sum('amount');

        $paidExpenseThisMonth = Transaction::byUser($userId)
            ->where('status', TransactionStatus::Paid->value)
            ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value, TransactionType::InvestmentIn->value])
            ->whereMonth('date', $today->month)
            ->whereYear('date', $today->year)
            ->sum('amount');

        // Saldo que você tinha no dia 01/mês
        $runningBalance = $currentBalance - (float)$paidIncomeThisMonth + (float)$paidExpenseThisMonth;

        foreach ($projection as &$month) {
            $totalOut         = $month['expense'] + $month['installments'] + $month['credit_card'];
            $month['net']     = round($month['income'] - $totalOut, 2);
            
            // O NOVO SALDO é o Saldo Anterior + o que entrou/saiu NESTE mês
            $runningBalance  += $month['net'];
            $month['balance'] = round($runningBalance, 2);

            $month['income']       = round($month['income'], 2);
            $month['expense']      = round($month['expense'], 2);
            $month['installments'] = round($month['installments'], 2);
            $month['credit_card']  = round($month['credit_card'], 2);
        }

        return array_values($projection);
    }
}
