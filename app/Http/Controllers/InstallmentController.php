<?php

namespace App\Http\Controllers;

use App\Jobs\CreateCalendarEvent;
use App\Models\Installment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
    public function syncCalendar(Installment $installment): RedirectResponse
    {
        if ($installment->group->user_id !== auth()->id()) abort(403);

        if (! auth()->user()->google_calendar_enabled) {
            return back()->with('error', 'Google Calendar não conectado.');
        }

        if (! empty($installment->google_event_id)) {
            return back()->with('error', 'Esta parcela já possui evento na agenda.');
        }

        CreateCalendarEvent::dispatch(Installment::class, $installment->id, auth()->id());

        return back()->with('success', 'Parcela enviada para sincronização com o Google Calendar!');
    }

    public function markAsPaid(Installment $installment, Request $request): RedirectResponse
    {
        if ($installment->group->user_id !== auth()->id()) {
            abort(403);
        }

        $bankAccountId = $request->input('bank_account_id');

        // Associar conta bancária à transaction vinculada se ainda não tiver
        if ($bankAccountId && $installment->transaction && !$installment->transaction->bank_account_id) {
            $installment->transaction->update(['bank_account_id' => (int) $bankAccountId]);
        }

        $installment->markAsPaid();

        return redirect()->back()
            ->with('success', 'Parcela marcada como paga!');
    }
}
