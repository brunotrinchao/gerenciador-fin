<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Jobs\DeleteCalendarEvent;
use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\Category;
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
        $userId  = Auth::id();
        $user    = Auth::user();
        $options = $request->input('options', []);
        $steps   = [];

        $clearAll          = in_array('everything', $options);
        $clearTransactions = $clearAll || in_array('transactions', $options);
        $clearStatements   = $clearAll || in_array('statements', $options);
        $clearCards        = $clearAll || in_array('cards', $options);
        $clearAccounts     = $clearAll || in_array('accounts', $options);
        $clearCategories   = $clearAll || in_array('categories', $options);
        $clearInvestments  = $clearAll || in_array('investments', $options);
        $clearBudgets      = $clearAll || in_array('budgets', $options);

        // 1. Google Calendar Cleanup (Before deleting records)
        if ($user->google_calendar_enabled) {
            if ($clearTransactions) {
                Transaction::where('user_id', $userId)
                    ->whereNotNull('google_event_id')
                    ->each(fn (Transaction $t) => DeleteCalendarEvent::dispatch($t->google_event_id, $userId));

                $groupIds = InstallmentGroup::where('user_id', $userId)->pluck('id');
                Installment::whereIn('installment_group_id', $groupIds)
                    ->whereNotNull('google_event_id')
                    ->each(fn (Installment $i) => DeleteCalendarEvent::dispatch($i->google_event_id, $userId));
            }

            if ($clearStatements) {
                CreditCardStatement::where('user_id', $userId)
                    ->whereNotNull('google_event_id')
                    ->each(fn (CreditCardStatement $s) => DeleteCalendarEvent::dispatch($s->google_event_id, $userId));
            }

            if ($clearTransactions || $clearStatements) {
                $steps[] = 'Eventos do Google Calendar marcados para remoção';
            }
        }

        // 2. Data Deletion
        if ($clearTransactions) {
            Transaction::where('user_id', $userId)->forceDelete();
            InstallmentGroup::where('user_id', $userId)->forceDelete();
            $steps[] = 'Transações e parcelamentos removidos';
        }

        if ($clearStatements) {
            CreditCardStatement::where('user_id', $userId)->delete();
            $steps[] = 'Faturas de cartão removidas';
        }

        if ($clearInvestments) {
            Investment::where('user_id', $userId)->forceDelete();
            $steps[] = 'Investimentos removidos';
        }

        if ($clearBudgets) {
            Budget::where('user_id', $userId)->delete();
            $steps[] = 'Orçamentos removidos';
        }

        if ($clearCards) {
            CreditCard::where('user_id', $userId)->delete();
            $steps[] = 'Cartões removidos';
        }

        if ($clearAccounts) {
            BankAccount::where('user_id', $userId)->delete();
            $steps[] = 'Contas bancárias removidas';
        }

        if ($clearCategories) {
            Category::where('user_id', $userId)->delete();
            $steps[] = 'Categorias personalizadas removidas';
        }

        if (empty($steps)) {
            $steps[] = 'Nenhum dado selecionado para limpeza';
        } else {
            $steps[] = 'Limpeza concluída com sucesso';
        }

        return response()->json([
            'steps'     => $steps,
            'completed' => true,
        ]);
    }
}
