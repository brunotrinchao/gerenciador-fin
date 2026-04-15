<?php

namespace App\Observers;

use App\Jobs\CreateCalendarEvent;
use App\Jobs\DeleteCalendarEvent;
use App\Jobs\UpdateCalendarEvent;
use App\Models\CreditCardStatement;

class CreditCardStatementObserver
{
    public function created(CreditCardStatement $statement): void
    {
        if ($statement->user->google_calendar_enabled) {
            CreateCalendarEvent::dispatch(CreditCardStatement::class, $statement->id, $statement->user_id);
        }
    }

    public function updated(CreditCardStatement $statement): void
    {
        if (! $statement->user->google_calendar_enabled) {
            return;
        }

        // Se a fatura foi paga, remove da agenda
        if ($statement->wasChanged('status') && $statement->status === 'paid') {
            if (! empty($statement->google_event_id)) {
                DeleteCalendarEvent::dispatch($statement->google_event_id, $statement->user_id);
                $statement->withoutEvents(fn () => $statement->update(['google_event_id' => null]));
            }
            return;
        }

        // Se reabriu, recria
        if ($statement->wasChanged('status') && $statement->status !== 'paid') {
            if (empty($statement->google_event_id)) {
                CreateCalendarEvent::dispatch(CreditCardStatement::class, $statement->id, $statement->user_id);
                return;
            }
        }

        // Se mudar data ou valor, atualiza
        if (! empty($statement->google_event_id)) {
            if ($statement->isDirty(['due_date', 'total_amount', 'reference_month'])) {
                UpdateCalendarEvent::dispatch(CreditCardStatement::class, $statement->id, $statement->user_id);
            }
        }
    }

    public function deleted(CreditCardStatement $statement): void
    {
        if (! empty($statement->google_event_id)) {
            DeleteCalendarEvent::dispatch($statement->google_event_id, $statement->user_id);
        }
    }
}
