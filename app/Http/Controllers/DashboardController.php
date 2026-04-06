<?php

namespace App\Http\Controllers;

use App\Enums\TransactionType;
use App\Enums\TransactionStatus;
use App\Models\BankAccount;
use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\Investment;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $userId = Auth::id();
        $now    = Carbon::now();

        // ── Saldo total das contas ativas ─────────────────────
        $totalBalance = BankAccount::byUser($userId)
            ->active()
            ->sum('current_balance');

        // ── Dívida total de cartões (transações crédito pendentes) ──
        $totalDebt = Transaction::byUser($userId)
            ->where('type', TransactionType::CreditCard->value)
            ->where('status', TransactionStatus::Pending->value)
            ->sum('amount');

        // ── Total investido ───────────────────────────────────
        $totalInvested = Investment::where('user_id', $userId)
            ->where('status', 'active')
            ->sum('current_amount');

        // ── Pagamentos próximos (7 dias) ──────────────────────
        $from = $now->toDateString();
        $to   = $now->copy()->addDays(7)->toDateString();

        $upcoming = collect();

        // 1. Faturas com vencimento próximo
        CreditCardStatement::where('user_id', $userId)
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$from, $to])
            ->where('status', '!=', 'paid')
            ->with('creditCard')
            ->get()
            ->each(function ($stmt) use (&$upcoming) {
                $upcoming->push([
                    'id'          => $stmt->id,
                    'type'        => 'invoice',
                    'description' => 'Fatura ' . ($stmt->creditCard?->name ?? 'Cartão') . ' — ' . $stmt->reference_month,
                    'amount'      => (float) $stmt->total_amount,
                    'date'        => $stmt->due_date,
                    'category'    => null,
                    'status'      => $stmt->status,
                ]);
            });

        // 2. Parcelas de conta bancária com vencimento próximo
        Installment::whereHas('group', fn ($q) => $q
            ->where('user_id', $userId)
            ->whereNull('credit_card_id')
        )
            ->whereBetween('due_date', [$from, $to])
            ->where('status', TransactionStatus::Pending->value)
            ->with(['group.category'])
            ->get()
            ->each(function ($inst) use (&$upcoming) {
                $upcoming->push([
                    'id'          => $inst->id,
                    'type'        => 'installment',
                    'description' => ($inst->group?->description ?? 'Parcela') . " ({$inst->number}/{$inst->group?->total_installments})",
                    'amount'      => (float) $inst->amount,
                    'date'        => $inst->due_date->format('Y-m-d'),
                    'category'    => $inst->group?->category?->name,
                    'status'      => $inst->status->value,
                ]);
            });

        // 3. Transações simples (sem parcela e sem cartão de crédito)
        Transaction::byUser($userId)
            ->where('status', TransactionStatus::Pending->value)
            ->whereIn('type', [TransactionType::Expense->value])
            ->whereNull('installment_group_id')
            ->whereBetween('date', [$from, $to])
            ->with('category')
            ->get()
            ->each(function ($t) use (&$upcoming) {
                $upcoming->push([
                    'id'          => $t->id,
                    'type'        => 'transaction',
                    'description' => $t->description,
                    'amount'      => (float) $t->amount,
                    'date'        => $t->date->format('Y-m-d'),
                    'category'    => $t->category?->name,
                    'status'      => $t->status->value,
                ]);
            });

        $upcomingPayments = $upcoming->sortBy('date')->take(10)->values();

        // ── Gastos por categoria (mês atual) ──────────────────
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
            ->take(8)
            ->values();

        // ── Fluxo de caixa (últimos 6 meses) ─────────────────
        $cashFlow = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $y     = $month->year;
            $m     = $month->month;

            $income = Transaction::byUser($userId)
                ->where('type', TransactionType::Income->value)
                ->where('status', TransactionStatus::Paid->value)
                ->whereYear('date', $y)
                ->whereMonth('date', $m)
                ->sum('amount');

            $expense = Transaction::byUser($userId)
                ->whereIn('type', [TransactionType::Expense->value, TransactionType::CreditCard->value])
                ->where('status', TransactionStatus::Paid->value)
                ->whereYear('date', $y)
                ->whereMonth('date', $m)
                ->sum('amount');

            $cashFlow->push([
                'month'   => $month->format('M/y'),
                'income'  => round((float)$income, 2),
                'expense' => round((float)$expense, 2),
            ]);
        }

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_balance'   => round((float)$totalBalance, 2),
                'total_debt'      => round((float)$totalDebt, 2),
                'total_invested'  => round((float)$totalInvested, 2),
                'upcoming_count'  => $upcomingPayments->count(),
            ],
            'upcomingPayments'   => $upcomingPayments,
            'expensesByCategory' => $expensesByCategory,
            'cashFlow'           => $cashFlow,
        ]);
    }
}
