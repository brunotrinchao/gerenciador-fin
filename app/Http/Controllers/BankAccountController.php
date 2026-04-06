<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankAccountRequest;
use App\Http\Requests\UpdateBankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function index(): Response
    {
        $accounts = BankAccount::byUser(auth()->id())
            ->orderBy('name')
            ->get();

        return Inertia::render('BankAccounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreBankAccountRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();
        $data['current_balance'] = $data['initial_balance'];
        $data['color'] = $data['color'] ?? '#22c55e';
        $data['is_active'] = $data['is_active'] ?? true;

        BankAccount::create($data);

        return redirect()->route('bank-accounts.index')
            ->with('success', 'Conta criada com sucesso!');
    }

    public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount): RedirectResponse
    {
        if ($bankAccount->user_id !== auth()->id()) {
            abort(403);
        }

        $data = $request->validated();

        // Se mudou o saldo inicial, recalcular o saldo atual
        if (isset($data['initial_balance']) && $data['initial_balance'] != $bankAccount->initial_balance) {
            $bankAccount->update($data);
            $bankAccount->recalculateBalance();
        } else {
            unset($data['initial_balance']);
            $bankAccount->update($data);
        }

        return redirect()->route('bank-accounts.index')
            ->with('success', 'Conta atualizada com sucesso!');
    }

    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        if ($bankAccount->user_id !== auth()->id()) {
            abort(403);
        }

        $bankAccount->delete();

        return redirect()->route('bank-accounts.index')
            ->with('success', 'Conta excluída com sucesso!');
    }
}
