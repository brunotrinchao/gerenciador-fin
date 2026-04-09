<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaxEventRequest;
use App\Models\BankAccount;
use App\Models\TaxEvent;
use App\Services\TaxPlanningService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TaxPlanningController extends Controller
{
    public function index(): Response
    {
        $taxEvents = TaxEvent::byUser(auth()->id())
            ->with('bankAccount')
            ->orderByDesc('year')
            ->orderBy('first_due_date')
            ->get()
            ->groupBy('year');

        $bankAccounts = BankAccount::where('user_id', auth()->id())->get(['id', 'name']);

        return Inertia::render('TaxPlanning/Index', [
            'taxEventsByYear' => $taxEvents,
            'bankAccounts'    => $bankAccounts,
            'currentYear'     => now()->year,
        ]);
    }

    public function store(StoreTaxEventRequest $request, TaxPlanningService $service): RedirectResponse
    {
        $service->createWithTransactions($request->validated(), auth()->user());

        return back()->with('success', 'Imposto cadastrado e parcelas agendadas.');
    }

    public function destroy(TaxEvent $taxEvent): RedirectResponse
    {
        abort_unless($taxEvent->user_id === auth()->id(), 403);
        $taxEvent->delete();

        return back()->with('success', 'Imposto removido.');
    }
}
