<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\BankAccount;
use App\Models\Investment;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        $userId = Auth::id();
        $now    = Carbon::now();

        // ── 1. Fluxo de Caixa — últimos 12 meses ─────────────────
        $cashFlow = collect();
        for ($i = 11; $i >= 0; $i--) {
            $month   = $now->copy()->subMonths($i);
            $income  = Transaction::byUser($userId)
                ->where('type', TransactionType::Income->value)
                ->where('status', TransactionStatus::Paid->value)
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->sum('amount');
            $expense = Transaction::byUser($userId)
                ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value])
                ->where('status', TransactionStatus::Paid->value)
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->sum('amount');
            $cashFlow->push([
                'month'     => $month->format('M/y'),
                'month_key' => $month->format('Y-m'),
                'income'    => round((float) $income, 2),
                'expense'   => round((float) $expense, 2),
                'net'       => round((float) $income - (float) $expense, 2),
            ]);
        }

        // ── 2. Despesas por Categoria — mês atual ──────────────────
        $expensesByCategory = Transaction::byUser($userId)
            ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value])
            ->where('status', TransactionStatus::Paid->value)
            ->whereYear('date', $now->year)
            ->whereMonth('date', $now->month)
            ->with('category')
            ->get()
            ->groupBy(fn ($t) => $t->category?->name ?? 'Outros')
            ->map(fn ($group, $name) => [
                'name'  => $name,
                'value' => round($group->sum('amount'), 2),
                'color' => $group->first()->category?->color ?? '#6b7280',
            ])
            ->values()
            ->sortByDesc('value')
            ->values();

        // ── 3. Despesas Fixas vs Variáveis — mês atual ──────────────
        $allExpenses = Transaction::byUser($userId)
            ->whereIn('type', [TransactionType::Expense->value])
            ->where('status', TransactionStatus::Paid->value)
            ->whereYear('date', $now->year)
            ->whereMonth('date', $now->month)
            ->get();

        $fixedExpenses    = $allExpenses->where('is_recurring', true)->sum('amount');
        $variableExpenses = $allExpenses->where('is_recurring', false)->sum('amount');

        // ── 4. Patrimônio Líquido ─────────────────────────────────
        $totalBankBalance = (float) BankAccount::byUser($userId)->active()->sum('current_balance');
        $totalInvested    = (float) Investment::where('user_id', $userId)->where('status', 'active')->sum('current_amount');
        $totalDebt        = (float) Transaction::byUser($userId)
            ->where('type', TransactionType::CreditCard->value)
            ->where('status', TransactionStatus::Pending->value)
            ->sum('amount');
        $netWorth         = $totalBankBalance + $totalInvested - $totalDebt;

        return Inertia::render('Reports/Index', [
            'cashFlow'           => $cashFlow->values(),
            'expensesByCategory' => $expensesByCategory,
            'fixedExpenses'      => round($fixedExpenses, 2),
            'variableExpenses'   => round($variableExpenses, 2),
            'netWorth'           => [
                'bank_balance' => round($totalBankBalance, 2),
                'invested'     => round($totalInvested, 2),
                'debt'         => round($totalDebt, 2),
                'total'        => round($netWorth, 2),
            ],
            'currentMonth'       => $now->format('Y-m'),
        ]);
    }
}
