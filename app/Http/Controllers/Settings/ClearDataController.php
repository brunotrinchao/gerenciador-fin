<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\CreditCard;
use App\Models\CreditCardStatement;
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
        $steps  = [];

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
