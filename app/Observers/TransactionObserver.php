<?php

namespace App\Observers;

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
    }

    public function updated(Transaction $transaction): void
    {
        if ($transaction->isDirty(['amount', 'type', 'status', 'bank_account_id', 'credit_card_id'])) {
            if ($transaction->bank_account_id) {
                $transaction->bankAccount->recalculateBalance();
            }
            // Se mudou de conta, recalcular a conta anterior também
            if ($transaction->wasChanged('bank_account_id') && $transaction->getOriginal('bank_account_id')) {
                $oldAccount = \App\Models\BankAccount::find($transaction->getOriginal('bank_account_id'));
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
    }

    public function deleted(Transaction $transaction): void
    {
        if ($transaction->bank_account_id) {
            $transaction->bankAccount->recalculateBalance();
        }

        if ($transaction->credit_card_id) {
            $this->recalculateCardLimit($transaction->credit_card_id);
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
        $card = \App\Models\CreditCard::find($cardId);
        $card?->recalculateLimit();
    }
}
