<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
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
