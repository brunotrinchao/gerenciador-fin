<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInstallmentRequest;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\CreditCard;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use App\Services\InstallmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstallmentGroupController extends Controller
{
    public function index(Request $request): Response
    {
        $query = InstallmentGroup::where('user_id', auth()->id())
            ->with(['installments', 'creditCard', 'bankAccount', 'category']);

        // Filtro por tipo
        if ($request->filled('type')) {
            if ($request->input('type') === 'credit_card') {
                $query->whereNotNull('credit_card_id');
            } elseif ($request->input('type') === 'bank_account') {
                $query->whereNull('credit_card_id');
            }
        }

        // Filtro por cartão específico
        if ($request->filled('credit_card_id')) {
            $query->where('credit_card_id', $request->input('credit_card_id'));
        }

        // Ordenação
        $sort = $request->input('sort', 'created_desc');
        match ($sort) {
            'progress_asc'  => $query->orderByRaw('(paid_installments / NULLIF(total_installments, 0)) DESC'),
            'progress_desc' => $query->orderByRaw('(paid_installments / NULLIF(total_installments, 0)) ASC'),
            default         => $query->orderBy('created_at', 'desc'),
        };

        $groups = $query->get();

        $accounts    = BankAccount::byUser(auth()->id())->active()->get();
        $creditCards = CreditCard::byUser(auth()->id())->active()->get();
        $categories  = Category::where(function ($q) {
            $q->whereNull('user_id')->orWhere('user_id', auth()->id());
        })->orderBy('name')->get();

        // Transações importadas com padrão parcela (ex: "AMAZON 3/12")
        $userId = auth()->id();
        $importedInstallments = Transaction::where('user_id', $userId)
            ->where('is_imported', true)
            ->whereNotNull('credit_card_id')
            ->whereRaw("description REGEXP '[0-9]+/[0-9]+'")
            ->with('creditCard')
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn ($t) => [
                'id'                 => $t->id,
                'description'        => $t->description,
                'amount'             => (float) $t->amount,
                'date'               => $t->date->format('Y-m-d'),
                'status'             => $t->status->value,
                'credit_card_name'   => $t->creditCard?->name,
                'installment_number' => null,
                'total_installments' => null,
            ]);

        return Inertia::render('Installments/Index', [
            'groups'               => $groups,
            'accounts'             => $accounts,
            'creditCards'          => $creditCards,
            'categories'           => $categories,
            'importedInstallments' => $importedInstallments,
            'filters'              => $request->only(['type', 'credit_card_id', 'sort']),
        ]);
    }

    public function store(StoreInstallmentRequest $request, InstallmentService $installmentService): RedirectResponse
    {
        $data            = $request->validated();
        $data['user_id'] = auth()->id();

        $installmentService->create($data);

        return redirect()->route('installments.index')
            ->with('success', 'Parcelamento criado com sucesso!');
    }

    public function destroy(InstallmentGroup $installmentGroup): RedirectResponse
    {
        if ($installmentGroup->user_id !== auth()->id()) {
            abort(403);
        }

        $installmentGroup->cancelFutureInstallments();

        return redirect()->route('installments.index')
            ->with('success', 'Parcelamento cancelado com sucesso!');
    }
}
