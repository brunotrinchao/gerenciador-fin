<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCreditCardRequest;
use App\Http\Requests\UpdateCreditCardRequest;
use App\Models\BankAccount;
use App\Models\CreditCard;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CreditCardController extends Controller
{
    public function index(): Response
    {
        $cards    = CreditCard::byUser(auth()->id())
            ->with('bankAccount')
            ->orderBy('name')
            ->get();

        $accounts = BankAccount::byUser(auth()->id())->active()->get();

        return Inertia::render('CreditCards/Index', [
            'cards'    => $cards,
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreCreditCardRequest $request): RedirectResponse
    {
        $data                    = $request->validated();
        $data['user_id']         = auth()->id();
        $data['available_limit'] = $data['credit_limit'];
        $data['color']           = $data['color'] ?? '#6366f1';
        $data['is_active']       = $data['is_active'] ?? true;

        CreditCard::create($data);

        return redirect()->route('credit-cards.index')
            ->with('success', 'Cartão criado com sucesso!');
    }

    public function update(UpdateCreditCardRequest $request, CreditCard $creditCard): RedirectResponse
    {
        if ($creditCard->user_id !== auth()->id()) {
            abort(403);
        }

        $creditCard->update($request->validated());
        $creditCard->recalculateLimit();

        return redirect()->route('credit-cards.index')
            ->with('success', 'Cartão atualizado com sucesso!');
    }

    public function destroy(CreditCard $creditCard): RedirectResponse
    {
        if ($creditCard->user_id !== auth()->id()) {
            abort(403);
        }

        $creditCard->delete();

        return redirect()->route('credit-cards.index')
            ->with('success', 'Cartão excluído com sucesso!');
    }
}
