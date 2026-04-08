<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Jobs\DeleteCalendarEvent;
use App\Models\BankAccount;
use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Investment;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClearDataController extends Controller
{
    public function destroy(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $user   = Auth::user();
        $steps  = [];

        // Remove eventos do Google Calendar antes de apagar os dados
        // (forceDelete em massa não dispara observers, então é preciso fazer aqui)
        if ($user->google_calendar_enabled) {
            Transaction::where('user_id', $userId)
                ->whereNotNull('google_event_id')
                ->each(fn (Transaction $t) => DeleteCalendarEvent::dispatch($t->google_event_id, $userId));

            $groupIds = InstallmentGroup::where('user_id', $userId)->pluck('id');
            Installment::whereIn('installment_group_id', $groupIds)
                ->whereNotNull('google_event_id')
                ->each(fn (Installment $i) => DeleteCalendarEvent::dispatch($i->google_event_id, $userId));

            CreditCardStatement::where('user_id', $userId)
                ->whereNotNull('google_event_id')
                ->each(fn (CreditCardStatement $s) => DeleteCalendarEvent::dispatch($s->google_event_id, $userId));

            $steps[] = 'Eventos do Google Calendar marcados para remoção';
        }

        // Etapa 1: Transações e parcelamentos
        Transaction::where('user_id', $userId)->forceDelete();
        InstallmentGroup::where('user_id', $userId)->forceDelete();
        $steps[] = 'Transações e parcelamentos removidos';

        // Etapa 2: Faturas de cartão
        CreditCardStatement::where('user_id', $userId)->delete();
        $steps[] = 'Faturas de cartão removidas';

        // Etapa 3: Investimentos
        Investment::where('user_id', $userId)->forceDelete();
        $steps[] = 'Investimentos removidos';

        // Etapa 4: Cartões e contas bancárias
        CreditCard::where('user_id', $userId)->delete();
        BankAccount::where('user_id', $userId)->delete();
        $steps[] = 'Cartões e contas bancárias removidos';

        // Etapa 5: Concluído
        $steps[] = 'Sistema reiniciado com sucesso';

        return response()->json([
            'steps'     => $steps,
            'completed' => true,
        ]);
    }
}
