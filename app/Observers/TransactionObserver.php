<?php

namespace App\Observers;

use App\Enums\TransactionStatus;
use App\Jobs\CreateCalendarEvent;
use App\Jobs\DeleteCalendarEvent;
use App\Jobs\UpdateCalendarEvent;
use App\Models\BankAccount;
use App\Models\CreditCard;
use App\Models\Transaction;

class TransactionObserver
{
    public function created(Transaction $transaction): void
    {
        if ($transaction->bank_account_id) {
            $transaction->bankAccount->recalculateBalance();
        }

        if ($transaction->credit_card_id) {
            $this->recalculateCardLimit($transaction->credit_card_id);
        }

        // Cria evento no Calendar para transações pendentes ou agendadas (exceto parcelas, que têm evento próprio)
        $isEligibleForCalendar = in_array($transaction->status, [
            TransactionStatus::Pending,
            TransactionStatus::Scheduled,
        ]);
        if (
            $isEligibleForCalendar
            && is_null($transaction->installment_group_id)
            && $transaction->user->google_calendar_enabled
        ) {
            CreateCalendarEvent::dispatch(Transaction::class, $transaction->id, $transaction->user_id);
        }
    }

    public function updated(Transaction $transaction): void
    {
        if ($transaction->isDirty(['amount', 'type', 'status', 'bank_account_id', 'credit_card_id'])) {
            if ($transaction->bank_account_id) {
                $transaction->bankAccount->recalculateBalance();
            }
            // Se mudou de conta, recalcular a conta anterior também
            if ($transaction->wasChanged('bank_account_id') && $transaction->getOriginal('bank_account_id')) {
                $oldAccount = BankAccount::find($transaction->getOriginal('bank_account_id'));
                $oldAccount?->recalculateBalance();
            }

            if ($transaction->credit_card_id) {
                $this->recalculateCardLimit($transaction->credit_card_id);
            }
            // Se mudou de cartão
            if ($transaction->wasChanged('credit_card_id') && $transaction->getOriginal('credit_card_id')) {
                $this->recalculateCardLimit($transaction->getOriginal('credit_card_id'));
            }
        }

        // --- Sincronização Google Calendar ---
        if ($transaction->user->google_calendar_enabled) {
            $isEligible = in_array($transaction->status, [TransactionStatus::Pending, TransactionStatus::Scheduled])
                && is_null($transaction->installment_group_id);

            if ($isEligible) {
                if (empty($transaction->google_event_id)) {
                    // Passou a ser elegível (ex: de Pago para Pendente)
                    \App\Jobs\CreateCalendarEvent::dispatch(Transaction::class, $transaction->id, $transaction->user_id);
                } elseif ($transaction->isDirty(['description', 'amount', 'date', 'status', 'category_id', 'bank_account_id', 'credit_card_id'])) {
                    // Já tem evento, mas os dados mudaram
                    \App\Jobs\UpdateCalendarEvent::dispatch(Transaction::class, $transaction->id, $transaction->user_id);
                }
            } else {
                // Deixou de ser elegível (ex: Pago ou Cancelado)
                if (! empty($transaction->google_event_id)) {
                    \App\Jobs\DeleteCalendarEvent::dispatch($transaction->google_event_id, $transaction->user_id);
                    $transaction->withoutEvents(fn () => $transaction->update(['google_event_id' => null]));
                }
            }
        }
    }

    public function deleted(Transaction $transaction): void
    {
        if ($transaction->bank_account_id) {
            $transaction->bankAccount->recalculateBalance();
        }

        if ($transaction->credit_card_id) {
            $this->recalculateCardLimit($transaction->credit_card_id);
        }

        // Remove evento do Calendar ao deletar
        if (! empty($transaction->google_event_id)) {
            DeleteCalendarEvent::dispatch($transaction->google_event_id, $transaction->user_id);
        }
    }

    public function restored(Transaction $transaction): void
    {
        if ($transaction->bank_account_id) {
            $transaction->bankAccount->recalculateBalance();
        }

        if ($transaction->credit_card_id) {
            $this->recalculateCardLimit($transaction->credit_card_id);
        }
    }

    protected function recalculateCardLimit(int $cardId): void
    {
        $card = CreditCard::find($cardId);
        $card?->recalculateLimit();
    }
}
