<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $year   = $request->integer('year',  now()->year);
        $month  = $request->integer('month', now()->month);

        $events = [];

        // 1. Transações do mês (excluindo credit_card e transações vinculadas a parcelas)
        Transaction::byUser($userId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereNotIn('type', ['credit_card'])
            ->whereNull('installment_group_id')
            ->with(['category', 'bankAccount'])
            ->get()
            ->each(function (Transaction $tx) use (&$events) {
                $day = $tx->date->format('Y-m-d');
                $events[$day][] = [
                    'id'          => $tx->id,
                    'type'        => 'transaction',
                    'subtype'     => $tx->type->value,
                    'description' => $tx->description,
                    'amount'      => (float) $tx->amount,
                    'status'      => $tx->status->value,
                    'category'    => $tx->category?->name,
                    'account'     => $tx->bankAccount?->name,
                    'payment_code' => $tx->payment_code,
                ];
            });

        // 2. Parcelas do mês (due_date) — apenas parcelas de conta bancária/boleto (não de cartão)
        Installment::whereHas('group', fn ($q) => $q
            ->where('user_id', $userId)
            ->whereNull('credit_card_id')
        )
            ->whereYear('due_date', $year)
            ->whereMonth('due_date', $month)
            ->with(['group.category'])
            ->get()
            ->each(function (Installment $inst) use (&$events) {
                $day = $inst->due_date->format('Y-m-d');
                $events[$day][] = [
                    'id'          => $inst->id,
                    'type'        => 'installment',
                    'subtype'     => 'installment',
                    'description' => $inst->group?->description
                                        . " ({$inst->number}/{$inst->group?->total_installments})",
                    'amount'      => (float) $inst->amount,
                    'status'      => $inst->status->value,
                    'category'    => $inst->group?->category?->name,
                    'account'     => null,
                ];
            });

        // 3. Faturas de cartão — por due_date OU por reference_month (quando due_date é null)
        $yearMonth = sprintf('%04d-%02d', $year, $month);

        CreditCardStatement::where('user_id', $userId)
            ->where(function ($q) use ($year, $month, $yearMonth) {
                $q->where(function ($inner) use ($year, $month) {
                    $inner->whereNotNull('due_date')
                          ->whereYear('due_date', $year)
                          ->whereMonth('due_date', $month);
                })->orWhere(function ($inner) use ($yearMonth) {
                    $inner->whereNull('due_date')
                          ->where('reference_month', $yearMonth);
                });
            })
            ->with('creditCard')
            ->get()
            ->each(function (CreditCardStatement $stmt) use (&$events) {
                // Usa due_date se disponível; senão cai no último dia do reference_month
                if ($stmt->due_date) {
                    $day = $stmt->due_date->format('Y-m-d');
                } else {
                    [$refY, $refM] = explode('-', $stmt->reference_month);
                    $day = \Carbon\Carbon::createFromDate((int) $refY, (int) $refM, 1)
                        ->endOfMonth()
                        ->format('Y-m-d');
                }

                $events[$day][] = [
                    'id'          => $stmt->id,
                    'type'        => 'invoice',
                    'subtype'     => 'invoice',
                    'description' => 'Fatura ' . ($stmt->creditCard?->name ?? 'Cartão')
                                        . ' — ' . $stmt->reference_month,
                    'amount'      => (float) $stmt->total_amount,
                    'status'      => $stmt->status,
                    'category'    => null,
                    'account'     => $stmt->creditCard?->name,
                ];
            });

        // Resumo do mês
        $allEvents = collect(array_merge(...array_values($events ?: [[]])));

        $totalPending = $allEvents
            ->filter(fn ($e) => $e['status'] === TransactionStatus::Pending->value || $e['status'] === 'open')
            ->where('subtype', '!=', 'income')
            ->sum('amount');

        $totalIncome = $allEvents
            ->where('subtype', 'income')
            ->sum('amount');

        return Inertia::render('Calendar', [
            'events'  => (object) $events,
            'year'    => $year,
            'month'   => $month,
            'summary' => [
                'totalPending' => round($totalPending, 2),
                'totalIncome'  => round($totalIncome, 2),
            ],
        ]);
    }
}
