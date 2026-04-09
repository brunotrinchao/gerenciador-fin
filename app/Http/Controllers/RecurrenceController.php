<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RecurrenceController extends Controller
{
    public function index(): Response
    {
        $recurrences = Transaction::where('user_id', auth()->id())
            ->where('is_recurring', true)
            ->whereNull('parent_transaction_id')
            ->with(['category', 'bankAccount', 'creditCard'])
            ->orderBy('date', 'asc')
            ->get();

        return Inertia::render('Recurrences/Index', [
            'recurrences' => $recurrences,
        ]);
    }

    public function cancel(Transaction $transaction): RedirectResponse
    {
        abort_unless($transaction->user_id === auth()->id(), 403);

        Transaction::where(function ($q) use ($transaction) {
            $q->where('id', $transaction->id)
              ->orWhere('parent_transaction_id', $transaction->id);
        })
        ->where('status', TransactionStatus::Pending)
        ->update(['status' => TransactionStatus::Cancelled]);

        return back()->with('success', 'Recorrência cancelada com sucesso.');
    }
}
