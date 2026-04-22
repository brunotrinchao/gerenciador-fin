<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\CreditCard;
use App\Models\Investment;
use App\Models\Transaction;

class FinancialHealthScoreService
{
    public function calculate(int $userId): array
    {
        $components = [
            'savings_rate'       => $this->scoreSavingsRate($userId),
            'credit_utilization' => $this->scoreCreditUtilization($userId),
            'emergency_fund'     => $this->scoreEmergencyFund($userId),
            'budget_adherence'   => $this->scoreBudgetAdherence($userId),
            'investment_habit'   => $this->scoreInvestmentHabit($userId),
        ];

        $total = (int) array_sum(array_column($components, 'score'));

        return [
            'total'         => min(100, max(0, $total)),
            'grade'         => $this->grade($total),
            'components'    => $components,
            'calculated_at' => now()->toDateTimeString(),
        ];
    }

    private function scoreSavingsRate(int $userId): array
    {
        $income = Transaction::byUser($userId)
            ->whereIn('type', [TransactionType::Income->value, TransactionType::InvestmentOut->value])
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', TransactionStatus::Paid->value)
            ->sum('amount');

        $expenses = Transaction::byUser($userId)
            ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value, TransactionType::InvestmentIn->value])
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', TransactionStatus::Paid->value)
            ->sum('amount');

        $rate  = $income > 0 ? (($income - $expenses) / $income) * 100 : 0;
        $score = min(20, max(0, ($rate / 20) * 20));

        return [
            'score' => round($score, 1),
            'label' => 'Taxa de Poupança',
            'value' => round($rate, 1),
            'unit'  => '%',
            'max'   => 20,
        ];
    }

    private function scoreCreditUtilization(int $userId): array
    {
        $cards      = CreditCard::where('user_id', $userId)->get();
        $totalLimit = $cards->sum('credit_limit');
        $totalUsed  = $totalLimit > 0 ? ($totalLimit - $cards->sum('available_limit')) : 0;

        $utilization = $totalLimit > 0 ? ($totalUsed / $totalLimit) * 100 : 0;
        $score       = $utilization <= 30 ? 20 : ($utilization <= 70 ? 10 : 0);

        return [
            'score' => (float)$score,
            'label' => 'Uso do Crédito',
            'value' => round($utilization, 1),
            'unit'  => '%',
            'max'   => 20,
        ];
    }

    private function scoreEmergencyFund(int $userId): array
    {
        $balance = (float) BankAccount::byUser($userId)->sum('current_balance');

        $monthlyExpenses = Transaction::byUser($userId)
            ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value])
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', TransactionStatus::Paid->value)
            ->sum('amount');

        $months = $monthlyExpenses > 0 ? $balance / $monthlyExpenses : 0;
        $score  = min(20, ($months / 6) * 20);

        return [
            'score' => round($score, 1),
            'label' => 'Reserva de Emergência',
            'value' => round($months, 1),
            'unit'  => 'meses',
            'max'   => 20,
        ];
    }

    private function scoreBudgetAdherence(int $userId): array
    {
        $budgets = Budget::where('user_id', $userId)
            ->where(function ($q) {
                $q->whereNull('reference_month')
                    ->orWhere('reference_month', now()->format('Y-m'));
            })
            ->with('category')
            ->get();

        if ($budgets->isEmpty()) {
            return [
                'score' => 10.0,
                'label' => 'Aderência ao Orçamento',
                'value' => 0,
                'unit'  => 'sem orçamento',
                'max'   => 20,
            ];
        }

        $onTrack = 0;
        foreach ($budgets as $budget) {
            $spent = Transaction::where('user_id', $userId)
                ->where('category_id', $budget->category_id)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value])
                ->whereIn('status', [TransactionStatus::Paid->value, TransactionStatus::Pending->value])
                ->sum('amount');

            if ($spent <= $budget->amount) {
                $onTrack++;
            }
        }

        $score = ($onTrack / $budgets->count()) * 20;

        return [
            'score' => round($score, 1),
            'label' => 'Aderência ao Orçamento',
            'value' => $onTrack,
            'unit'  => 'de ' . $budgets->count(),
            'max'   => 20,
        ];
    }

    private function scoreInvestmentHabit(int $userId): array
    {
        $hasInvestments = Investment::where('user_id', $userId)->exists();

        $recentInvestment = Transaction::where('user_id', $userId)
            ->where('type', TransactionType::InvestmentIn->value)
            ->where('date', '>=', now()->subDays(30))
            ->exists();

        $score = ($hasInvestments ? 10 : 0) + ($recentInvestment ? 10 : 0);

        return [
            'score' => (float)$score,
            'label' => 'Hábito de Investimento',
            'value' => $hasInvestments ? 1 : 0,
            'unit'  => '',
            'max'   => 20,
        ];
    }

    private function grade(int $score): string
    {
        return match (true) {
            $score >= 90 => 'A+',
            $score >= 80 => 'A',
            $score >= 70 => 'B',
            $score >= 60 => 'C',
            $score >= 40 => 'D',
            default      => 'F',
        };
    }
}
