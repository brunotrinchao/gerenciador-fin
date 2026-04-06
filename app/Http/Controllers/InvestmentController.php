<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Requests\StoreInvestmentRequest;
use App\Models\BankAccount;
use App\Models\Investment;
use App\Models\InvestmentSnapshot;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvestmentController extends Controller
{
    public function index(): Response
    {
        $userId = auth()->id();

        $investments = Investment::where('user_id', $userId)
            ->with(['bankAccount', 'snapshots' => fn ($q) => $q->orderBy('reference_date', 'desc')->limit(12)])
            ->orderBy('name')
            ->get();

        $accounts = BankAccount::byUser($userId)->active()->orderBy('name')->get();

        $summary = [
            'total_invested' => $investments->where('status', 'active')->sum('invested_amount'),
            'total_current'  => $investments->where('status', 'active')->sum('current_amount'),
        ];

        return Inertia::render('Investments/Index', [
            'investments' => $investments,
            'accounts'    => $accounts,
            'summary'     => $summary,
        ]);
    }

    public function store(StoreInvestmentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id']        = auth()->id();
        $data['current_amount'] = $data['current_amount'] ?? $data['invested_amount'];
        $data['status']         = 'active';

        Investment::create($data);

        return redirect()->route('investments.index')
            ->with('success', 'Investimento criado com sucesso!');
    }

    public function update(StoreInvestmentRequest $request, Investment $investment): RedirectResponse
    {
        if ($investment->user_id !== auth()->id()) abort(403);

        $investment->update($request->validated());

        return redirect()->route('investments.index')
            ->with('success', 'Investimento atualizado com sucesso!');
    }

    public function destroy(Investment $investment): RedirectResponse
    {
        if ($investment->user_id !== auth()->id()) abort(403);

        $investment->delete();

        return redirect()->route('investments.index')
            ->with('success', 'Investimento excluído com sucesso!');
    }

    public function snapshot(Request $request, Investment $investment): RedirectResponse
    {
        if ($investment->user_id !== auth()->id()) abort(403);

        $request->validate([
            'reference_date' => ['required', 'date'],
            'amount'         => ['required', 'numeric', 'min:0'],
        ]);

        $yieldAmount     = $request->amount - $investment->invested_amount;
        $yieldPercentage = $investment->invested_amount > 0
            ? round(($yieldAmount / $investment->invested_amount) * 100, 4)
            : 0;

        InvestmentSnapshot::create([
            'investment_id'    => $investment->id,
            'reference_date'   => $request->reference_date,
            'amount'           => $request->amount,
            'yield_amount'     => $yieldAmount,
            'yield_percentage' => $yieldPercentage,
        ]);

        $investment->update(['current_amount' => $request->amount]);

        return redirect()->route('investments.index')
            ->with('success', 'Snapshot registrado com sucesso!');
    }

    public function redeem(Request $request, Investment $investment): RedirectResponse
    {
        if ($investment->user_id !== auth()->id()) abort(403);

        $request->validate([
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'bank_account_id' => ['required', 'exists:bank_accounts,id'],
            'date'            => ['required', 'date'],
        ]);

        // Criar transação de resgate (investment_out = entrada na conta)
        Transaction::create([
            'user_id'         => auth()->id(),
            'bank_account_id' => $request->bank_account_id,
            'description'     => 'Resgate: ' . $investment->name,
            'amount'          => $request->amount,
            'type'            => TransactionType::InvestmentOut,
            'status'          => TransactionStatus::Paid,
            'date'            => $request->date,
        ]);

        // Atualizar status do investimento
        $newAmount = $investment->current_amount - $request->amount;
        if ($newAmount <= 0) {
            $investment->update(['status' => 'redeemed', 'current_amount' => 0]);
        } else {
            $investment->update(['current_amount' => $newAmount]);
        }

        return redirect()->route('investments.index')
            ->with('success', 'Resgate registrado com sucesso!');
    }
}
