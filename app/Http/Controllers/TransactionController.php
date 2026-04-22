<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Jobs\CreateCalendarEvent;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\Transaction;
use App\Services\InstallmentService;
use App\Services\RecurringTransactionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function __construct(
        protected InstallmentService $installmentService,
        protected RecurringTransactionService $recurringService,
    ) {}

    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $month  = $request->input('month', now()->format('Y-m'));
        $type   = $request->input('type');
        $status = $request->input('status');

        [$year, $mon] = explode('-', $month);

        // 1. Transações simples (sem parcelas/cartão)
        $query = Transaction::byUser($userId)
            ->with(['category', 'bankAccount', 'creditCard'])
            ->whereYear('date', $year)
            ->whereMonth('date', $mon)
            ->whereNull('installment_group_id')
            ->whereNotIn('type', ['credit_card'])
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($request->search, fn ($q) => $q->where('description', 'ilike', "%{$request->search}%"))
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        $transactions = $query->paginate(20)->withQueryString();

        // 2. Parcelas (Boleto/Conta) — Filtradas por Tipo
        $installments = [];
        if (!$type || in_array($type, ['expense', 'transfer'])) {
            $installments = Installment::whereHas('group', fn ($q) => $q
                    ->where('user_id', $userId)
                    ->whereNull('credit_card_id')
                )
                ->whereYear('due_date', $year)
                ->whereMonth('due_date', $mon)
                ->with(['group.category', 'group.bankAccount', 'transaction'])
                ->when($status, fn ($q) => $q->where('status', $status))
                ->orderBy('due_date', 'desc')
                ->get();
        }

        // 3. Faturas do mês — Filtradas por Tipo
        $statements = [];
        if (!$type || in_array($type, ['expense', 'credit_card'])) {
            $statements = CreditCardStatement::where('user_id', $userId)
                ->where('reference_month', $month)
                ->with('creditCard')
                ->when($status, function ($q) use ($status) {
                    if ($status === 'paid') return $q->where('status', 'paid');
                    if ($status === 'pending') return $q->where('status', '!=', 'paid');
                    return $q->whereRaw('1 = 0');
                })
                ->get();
        }

        // Resumo do mês
        $allMonth = Transaction::byUser($userId)->whereYear('date', $year)->whereMonth('date', $mon);
        $summary = [
            'income'      => (clone $allMonth)->where('type', TransactionType::Income->value)->sum('amount'),
            'expense'     => (clone $allMonth)->where('type', TransactionType::Expense->value)->sum('amount'),
            'credit_card' => (float) CreditCardStatement::where('user_id', $userId)->where('reference_month', $month)->sum('total_amount'),
        ];

        $accounts    = BankAccount::byUser($userId)->active()->orderBy('name')->get();
        $creditCards = CreditCard::byUser($userId)->active()->orderBy('name')->get();
        $categories  = Category::where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $userId))->orderBy('name')->get();

        return Inertia::render('Transactions/Index', [
            'transactions'          => $transactions,
            'installments'          => $installments,
            'statements'            => $statements,
            'accounts'              => $accounts,
            'creditCards'           => $creditCards,
            'categories'            => $categories,
            'filters'               => $request->only(['month', 'type', 'status', 'search']),
            'summary'               => $summary,
            'currentMonth'          => $month,
            'googleCalendarEnabled' => (bool) auth()->user()->google_calendar_enabled,
            'pendingSyncItems'      => [],
        ]);
    }

    public function store(StoreTransactionRequest $request): RedirectResponse
    {
        $data   = $request->validated();
        $userId = Auth::id();
        $type   = TransactionType::from($data['type']);

        if (! empty($data['total_installments']) && (int) $data['total_installments'] > 1) {
            $data['user_id']    = $userId;
            $data['start_date'] = $data['date'];
            $this->installmentService->create($data);
            return redirect()->route('transactions.index')->with('success', 'Compra parcelada registrada com sucesso!');
        }

        if ($type === TransactionType::Transfer) {
            $fromAccount = BankAccount::where('user_id', $userId)->findOrFail($data['bank_account_id']);
            $toAccount   = BankAccount::where('user_id', $userId)->findOrFail($data['transfer_to_account_id']);
            Transaction::create([
                'user_id' => $userId, 'bank_account_id' => $fromAccount->id, 'type' => TransactionType::Transfer,
                'description' => $data['description'] . ' → ' . $toAccount->name, 'amount' => $data['amount'],
                'status' => TransactionStatus::from($data['status']), 'date' => $data['date'], 'category_id' => $data['category_id'] ?? null,
            ]);
            Transaction::create([
                'user_id' => $userId, 'bank_account_id' => $toAccount->id, 'type' => TransactionType::Transfer,
                'description' => $data['description'] . ' ← ' . $fromAccount->name, 'amount' => $data['amount'],
                'status' => TransactionStatus::from($data['status']), 'date' => $data['date'], 'category_id' => $data['category_id'] ?? null,
            ]);
            return redirect()->route('transactions.index')->with('success', 'Transferência registrada com sucesso!');
        }

        $transaction = Transaction::create([
            'user_id' => $userId, 'bank_account_id' => $data['bank_account_id'] ?? null, 'credit_card_id' => $data['credit_card_id'] ?? null,
            'category_id' => $data['category_id'] ?? null, 'description' => $data['description'], 'amount' => $data['amount'],
            'type' => $type, 'status' => TransactionStatus::from($data['status']), 'date' => $data['date'],
            'is_recurring' => !empty($data['is_recurring']), 'recurrence_rule' => !empty($data['is_recurring']) ? $data['recurrence_rule'] : null,
        ]);

        if ($transaction->is_recurring) $this->recurringService->createSeries($transaction, $data);
        return redirect()->route('transactions.index')->with('success', 'Transação criada com sucesso!');
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);
        $transaction->update($request->validated());
        return redirect()->route('transactions.index')->with('success', 'Transação atualizada com sucesso!');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);
        $transaction->delete();
        return redirect()->route('transactions.index')->with('success', 'Transação excluída com sucesso!');
    }

    public function markAsPaid(Transaction $transaction, Request $request): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);
        $transaction->update(['status' => TransactionStatus::Paid]);
        return redirect()->back()->with('success', 'Transação marcada como paga!');
    }

    public function undoPayment(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);
        $transaction->update(['status' => TransactionStatus::Pending]);
        return back()->with('success', 'Pagamento desfeito!');
    }

    public function syncCalendar(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);
        CreateCalendarEvent::dispatch(Transaction::class, $transaction->id, Auth::id());
        return back()->with('success', 'Sincronizado!');
    }
}
