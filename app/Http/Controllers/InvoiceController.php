<?php

namespace App\Http\Controllers;

use App\Jobs\CreateCalendarEvent;
use App\Models\BankAccount;
use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\Transaction;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = auth()->id();
        $view   = $request->query('view', 'month'); // 'month' | 'year'

        if ($view === 'year') {
            $year = $request->query('year', now()->format('Y'));

            $statements = CreditCardStatement::where('user_id', $userId)
                ->with('creditCard')
                ->where('reference_month', 'like', $year . '-%')
                ->orderBy('reference_month', 'desc')
                ->paginate(50)
                ->withQueryString();

            $filters = ['view' => 'year', 'year' => $year];
        } else {
            $month = $request->query('month', now()->format('Y-m'));

            $statements = CreditCardStatement::where('user_id', $userId)
                ->with('creditCard')
                ->where('reference_month', $month)
                ->orderBy('reference_month', 'desc')
                ->paginate(24)
                ->withQueryString();

            $filters = ['view' => 'month', 'month' => $month];
        }

        $creditCards  = CreditCard::byUser($userId)->active()->orderBy('name')->get();
        $bankAccounts = BankAccount::byUser($userId)->active()->orderBy('name')->get();

        return Inertia::render('Invoices/Index', [
            'statements'            => $statements,
            'creditCards'           => $creditCards,
            'bankAccounts'          => $bankAccounts,
            'filters'               => $filters,
            'googleCalendarEnabled' => (bool) auth()->user()->google_calendar_enabled,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'credit_card_id'  => ['required', 'exists:credit_cards,id'],
            'reference_month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'closing_date'    => ['nullable', 'date'],
            'due_date'        => ['nullable', 'date'],
            'total_amount'    => ['required', 'numeric', 'min:0'],
        ]);

        // Evitar duplicata de reference_month por cartão
        $exists = CreditCardStatement::where('user_id', auth()->id())
            ->where('credit_card_id', $data['credit_card_id'])
            ->where('reference_month', $data['reference_month'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Já existe uma fatura para este cartão neste período.');
        }

        $statement = CreditCardStatement::create([
            ...$data,
            'user_id'     => auth()->id(),
            'paid_amount' => 0,
            'status'      => 'open',
        ]);

        // Cria evento no Calendar se a fatura tem vencimento
        if (auth()->user()->google_calendar_enabled && ! empty($statement->due_date)) {
            CreateCalendarEvent::dispatch(CreditCardStatement::class, $statement->id, auth()->id());
        }

        return redirect()->route('invoices.index')
            ->with('success', 'Fatura criada com sucesso!');
    }

    public function update(Request $request, CreditCardStatement $statement): RedirectResponse
    {
        if ($statement->user_id !== auth()->id()) abort(403);

        $data = $request->validate([
            'closing_date' => ['nullable', 'date'],
            'due_date'     => ['nullable', 'date'],
            'total_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $statement->update($data);

        return redirect()->route('invoices.index')->with('success', 'Fatura atualizada com sucesso!');
    }

    public function pay(CreditCardStatement $statement, Request $request): RedirectResponse
    {
        if ($statement->user_id !== auth()->id()) abort(403);

        $bankAccountId = $request->input('bank_account_id');

        [$year, $month] = explode('-', $statement->reference_month);

        // Itera individualmente para acionar o TransactionObserver (recalculateBalance)
        Transaction::where('user_id', auth()->id())
            ->where('credit_card_id', $statement->credit_card_id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->where('status', TransactionStatus::Pending->value)
            ->get()
            ->each(fn ($tx) => $tx->update(['status' => TransactionStatus::Paid->value]));

        // Cria débito na conta bancária se informada
        if ($bankAccountId) {
            // Valida que a conta pertence ao usuário autenticado
            BankAccount::byUser(auth()->id())->findOrFail($bankAccountId);

            Transaction::create([
                'user_id'                    => auth()->id(),
                'bank_account_id'            => (int) $bankAccountId,
                'credit_card_statement_id'   => $statement->id,
                'category_id'                => null,
                'description'                => 'Pagamento Fatura ' . ($statement->creditCard?->name ?? 'Cartão') . ' ' . $statement->reference_month,
                'amount'                     => $statement->total_amount,
                'type'                       => TransactionType::Expense,
                'status'                     => TransactionStatus::Paid,
                'date'                       => now()->toDateString(),
            ]);
        }

        $statement->update([
            'status'      => 'paid',
            'paid_amount' => $statement->total_amount,
        ]);

        return redirect()->route('invoices.index')->with('success', 'Fatura paga com sucesso!');
    }

    public function undoPayment(CreditCardStatement $statement): RedirectResponse
    {
        if ($statement->user_id !== auth()->id()) abort(403);

        if ($statement->status !== 'paid') {
            return back()->with('error', 'Esta fatura não está paga.');
        }

        $statement->update([
            'status'      => 'open',
            'paid_amount' => 0,
        ]);

        [$year, $month] = explode('-', $statement->reference_month);

        // Reverte transações do mês para "pendente"
        Transaction::where('user_id', auth()->id())
            ->where('credit_card_id', $statement->credit_card_id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->where('status', TransactionStatus::Paid->value)
            ->get()
            ->each(fn ($tx) => $tx->update(['status' => TransactionStatus::Pending->value]));

        // Exclui transação de pagamento no banco (dispara recalculo de saldo via observer)
        Transaction::where('user_id', auth()->id())
            ->where('credit_card_statement_id', $statement->id)
            ->where('type', TransactionType::Expense->value)
            ->delete();

        // Cria evento no Calendar se conectado e sem evento
        if (auth()->user()->google_calendar_enabled && empty($statement->google_event_id) && $statement->due_date) {
            CreateCalendarEvent::dispatch(CreditCardStatement::class, $statement->id, auth()->id());
        }

        return back()->with('success', 'Pagamento da fatura desfeito! Fatura voltou para aberta.');
    }

    public function syncCalendar(CreditCardStatement $statement): RedirectResponse
    {
        if ($statement->user_id !== auth()->id()) abort(403);

        if (! auth()->user()->google_calendar_enabled) {
            return back()->with('error', 'Google Calendar não conectado.');
        }

        if (! empty($statement->google_event_id)) {
            return back()->with('error', 'Esta fatura já possui evento na agenda.');
        }

        if (empty($statement->due_date)) {
            return back()->with('error', 'A fatura não possui data de vencimento para criar o evento.');
        }

        CreateCalendarEvent::dispatch(CreditCardStatement::class, $statement->id, auth()->id());

        return back()->with('success', 'Fatura enviada para sincronização com o Google Calendar!');
    }

    public function destroy(CreditCardStatement $statement): RedirectResponse
    {
        if ($statement->user_id !== auth()->id()) abort(403);

        $statement->delete();

        return redirect()->route('invoices.index')
            ->with('success', 'Fatura excluída com sucesso!');
    }
}
