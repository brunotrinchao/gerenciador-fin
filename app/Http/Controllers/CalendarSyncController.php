<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Jobs\CreateCalendarEvent;
use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;

class CalendarSyncController extends Controller
{
    public function syncAll(): RedirectResponse
    {
        $user   = auth()->user();
        $userId = auth()->id();

        if (! $user->google_calendar_enabled) {
            return back()->with('error', 'Google Calendar não conectado.');
        }

        $count = 0;

        // Transações pendentes simples
        Transaction::byUser($userId)
            ->where('status', TransactionStatus::Pending)
            ->whereNull('google_event_id')
            ->whereNull('installment_group_id')
            ->whereNotIn('type', ['credit_card', 'transfer'])
            ->each(function (Transaction $t) use ($userId, &$count) {
                CreateCalendarEvent::dispatch(Transaction::class, $t->id, $userId);
                $count++;
            });

        // Parcelas pendentes (não de cartão de crédito)
        Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId)->whereNull('credit_card_id'))
            ->where('status', TransactionStatus::Pending)
            ->whereNull('google_event_id')
            ->each(function (Installment $i) use ($userId, &$count) {
                CreateCalendarEvent::dispatch(Installment::class, $i->id, $userId);
                $count++;
            });

        // Faturas de cartão em aberto com data de vencimento
        CreditCardStatement::where('user_id', $userId)
            ->where('status', '!=', 'paid')
            ->whereNull('google_event_id')
            ->whereNotNull('due_date')
            ->each(function (CreditCardStatement $s) use ($userId, &$count) {
                CreateCalendarEvent::dispatch(CreditCardStatement::class, $s->id, $userId);
                $count++;
            });

        $label = $count === 1 ? '1 item enviado' : "{$count} itens enviados";

        return back()->with('success', "{$label} para sincronização com o Google Calendar!");
    }
}
