<?php

namespace App\Observers;

use App\Enums\TransactionStatus;
use App\Jobs\CreateCalendarEvent;
use App\Jobs\DeleteCalendarEvent;
use App\Jobs\UpdateCalendarEvent;
use App\Models\Installment;

class InstallmentObserver
{
    public function created(Installment $installment): void
    {
        $user = $installment->group?->user;
        $isEligible = in_array($installment->status, [TransactionStatus::Pending, TransactionStatus::Scheduled]);
        if ($user && $user->google_calendar_enabled && $isEligible) {
            CreateCalendarEvent::dispatch(Installment::class, $installment->id, $user->id);
        }
    }

    public function updated(Installment $installment): void
    {
        $user = $installment->group?->user;
        if (! $user || ! $user->google_calendar_enabled) {
            return;
        }

        // Se a parcela for paga ou cancelada, remove da agenda
        $isEligible = in_array($installment->status, [TransactionStatus::Pending, TransactionStatus::Scheduled]);

        if ($installment->wasChanged('status') && ! $isEligible) {
            if (! empty($installment->google_event_id)) {
                DeleteCalendarEvent::dispatch($installment->google_event_id, $user->id);
                $installment->withoutEvents(fn () => $installment->update(['google_event_id' => null]));
            }
            return;
        }

        // Se voltar a ser pendente ou agendada (ex: estorno), recria na agenda
        if ($installment->wasChanged('status') && $isEligible) {
            if (empty($installment->google_event_id)) {
                CreateCalendarEvent::dispatch(Installment::class, $installment->id, $user->id);
                return;
            }
        }

        // Se mudar data ou valor, atualiza na agenda
        if (! empty($installment->google_event_id)) {
            if ($installment->isDirty(['due_date', 'amount'])) {
                UpdateCalendarEvent::dispatch(Installment::class, $installment->id, $user->id);
            }
        }
    }

    public function deleted(Installment $installment): void
    {
        $user = $installment->group?->user;
        if ($user && ! empty($installment->google_event_id)) {
            DeleteCalendarEvent::dispatch($installment->google_event_id, $user->id);
        }
    }
}
