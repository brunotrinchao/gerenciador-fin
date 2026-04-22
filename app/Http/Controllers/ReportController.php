<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\BankAccount;
use App\Models\Investment;
use App\Models\Transaction;
use App\Models\CreditCard;
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
                ->incomes()
                ->where('status', TransactionStatus::Paid->value)
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->sum('amount');
            $expense = Transaction::byUser($userId)
                ->expenses()
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
            ->expenses()
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
            ->where(function ($query) {
                $query->where('type', TransactionType::CreditCard->value)
                    ->orWhereNotNull('installment_group_id');
            })
            ->where('status', TransactionStatus::Pending->value)
            ->sum('amount');
        $netWorth         = $totalBankBalance + $totalInvested - $totalDebt;

        // ── 5. Histórico e Projeção de Faturas (12 meses: -6 a +6) ──
        $invoicesHistory = collect();
        $allCards = CreditCard::byUser($userId)->get();
        
        for ($i = 6; $i >= -5; $i--) {
            $month = $now->copy()->subMonths($i);
            $monthKey = $month->format('Y-m');
            
            $total = 0;
            foreach ($allCards as $card) {
                // Simplificação: soma transações pendentes/pagas no mês/ano
                $total += (float) Transaction::byUser($userId)
                    ->where('credit_card_id', $card->id)
                    ->whereYear('date', $month->year)
                    ->whereMonth('date', $month->month)
                    ->sum('amount');
            }

            $invoicesHistory->push([
                'month' => $month->format('M/y'),
                'total' => round($total, 2),
                'type'  => $i > 0 ? 'Passado' : ($i == 0 ? 'Atual' : 'Projetado'),
            ]);
        }

        // ── 6. Uso por Cartão (Pizza) ─────────────────────────────
        $cardUsage = $allCards->map(function ($card) {
            $spent = (float) Transaction::byUser(Auth::id())
                ->where('credit_card_id', $card->id)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->sum('amount');

            return [
                'name'  => $card->name,
                'value' => round($spent, 2),
                'color' => $card->color ?? '#6b7280',
            ];
        })->filter(fn($c) => $c['value'] > 0)->values();

        // Faturas detalhadas p/ Cards
        $invoicesByCard = $allCards->map(function ($card) {
            $limit     = (float) $card->credit_limit;
            $available = (float) $card->available_limit;
            $used      = max(0, $limit - $available);
            
            return [
                'card_name' => $card->name,
                'bank_name' => $card->bank_name,
                'color'     => $card->color ?? '#6b7280',
                'limit'     => round($limit, 2),
                'available' => round($available, 2),
                'used'      => round($used, 2),
                'usage_percent' => $limit > 0 ? round(($used / $limit) * 100, 1) : 0,
                'pending'   => round((float) Transaction::byUser(Auth::id())
                    ->where('credit_card_id', $card->id)
                    ->where('status', TransactionStatus::Pending->value)
                    ->sum('amount'), 2),
            ];
        })->sortByDesc('used')->values();

        return Inertia::render('Reports/Index', [
            'cashFlow'           => $cashFlow->values(),
            'expensesByCategory' => $expensesByCategory,
            'fixedExpenses'      => round($fixedExpenses, 2),
            'variableExpenses'   => round($variableExpenses, 2),
            'invoicesByCard'     => $invoicesByCard,
            'invoicesHistory'    => $invoicesHistory->values(),
            'cardUsage'          => $cardUsage,
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
