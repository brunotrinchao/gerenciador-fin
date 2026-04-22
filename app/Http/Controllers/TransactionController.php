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

        [$year, $mon] = explode('-', $month);

        // Apenas transações simples: sem parcelas e sem lançamentos de cartão
        $query = Transaction::byUser($userId)
            ->with(['category', 'bankAccount', 'creditCard'])
            ->whereYear('date', $year)
            ->whereMonth('date', $mon)
            ->whereNull('installment_group_id')
            ->whereNotIn('type', ['credit_card'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where('description', 'ilike', "%{$request->search}%"))
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        $transactions = $query->paginate(20)->withQueryString();

        // Parcelas de conta bancária/boleto com vencimento no mês
        $installments = Installment::whereHas('group', fn ($q) => $q
                ->where('user_id', $userId)
                ->whereNull('credit_card_id')
            )
            ->whereYear('due_date', $year)
            ->whereMonth('due_date', $mon)
            ->with(['group.category', 'group.bankAccount', 'transaction'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('due_date', 'desc')
            ->get();

        // Resumo do mês
        $allMonth = Transaction::byUser($userId)
            ->whereYear('date', $year)
            ->whereMonth('date', $mon);

        // Faturas do mês
        $statements = CreditCardStatement::where('user_id', $userId)
            ->where('reference_month', $month)
            ->with('creditCard')
            ->get();

        // Transações credit_card NÃO são despesa de caixa — são dívidas pagas na fatura.
        // O valor das faturas é somado diretamente do total_amount dos statements do mês.
        $summary = [
            'income'      => (clone $allMonth)->where('type', TransactionType::Income->value)->sum('amount'),
            'expense'     => (clone $allMonth)->where('type', TransactionType::Expense->value)->sum('amount'),
            'credit_card' => (float) $statements->sum('total_amount'),
        ];

        // Dados para os formulários
        $accounts    = BankAccount::byUser($userId)->active()->orderBy('name')->get();
        $creditCards = CreditCard::byUser($userId)->active()->orderBy('name')->get();
        $categories  = Category::where(function ($q) use ($userId) {
            $q->whereNull('user_id')->orWhere('user_id', $userId);
        })->orderBy('name')->get();

        // Itens pendentes sem evento no Calendar (para sincronização em lote)
        $pendingSyncItems = [];
        if (auth()->user()->google_calendar_enabled) {
            $pendingTx = Transaction::byUser($userId)
                ->whereIn('status', [TransactionStatus::Pending, TransactionStatus::Scheduled])
                ->whereNull('google_event_id')
                ->whereNull('installment_group_id')
                ->whereNotIn('type', ['credit_card', 'transfer'])
                ->get(['id', 'description', 'amount', 'date', 'type'])
                ->map(fn ($t) => [
                    'type'        => 'transaction',
                    'id'          => $t->id,
                    'description' => $t->description,
                    'amount'      => (float) $t->amount,
                    'date'        => $t->date->format('Y-m-d'),
                ]);

            $pendingInst = Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId)->whereNull('credit_card_id'))
                ->whereIn('status', [TransactionStatus::Pending, TransactionStatus::Scheduled])
                ->whereNull('google_event_id')
                ->with('group:id,description,total_installments')
                ->get(['id', 'installment_group_id', 'number', 'amount', 'due_date'])
                ->map(fn ($i) => [
                    'type'        => 'installment',
                    'id'          => $i->id,
                    'description' => ($i->group->description ?? 'Parcela') . ' (' . $i->number . '/' . ($i->group->total_installments ?? '?') . ')',
                    'amount'      => (float) $i->amount,
                    'date'        => $i->due_date->format('Y-m-d'),
                ]);

            $pendingStmt = CreditCardStatement::where('user_id', $userId)
                ->where('status', '!=', 'paid')
                ->whereNull('google_event_id')
                ->whereNotNull('due_date')
                ->with('creditCard:id,name')
                ->get(['id', 'credit_card_id', 'reference_month', 'total_amount', 'due_date'])
                ->map(fn ($s) => [
                    'type'        => 'statement',
                    'id'          => $s->id,
                    'description' => 'Fatura ' . ($s->creditCard?->name ?? 'Cartão') . ' ' . $s->reference_month,
                    'amount'      => (float) $s->total_amount,
                    'date'        => $s->due_date->format('Y-m-d'),
                ]);

            $pendingSyncItems = $pendingTx->concat($pendingInst)->concat($pendingStmt)
                ->sortBy('date')
                ->values()
                ->all();
        }

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
            'pendingSyncItems'      => $pendingSyncItems,
        ]);
    }

    public function store(StoreTransactionRequest $request): RedirectResponse
    {
        $data   = $request->validated();
        $userId = Auth::id();
        $type   = TransactionType::from($data['type']);

        // Se houver parcelamento (acima de 1 parcela)
        if (! empty($data['total_installments']) && (int) $data['total_installments'] > 1) {
            $data['user_id']    = $userId;
            $data['start_date'] = $data['date']; // InstallmentService espera 'start_date'
            
            $this->installmentService->create($data);

            return redirect()->route('transactions.index')
                ->with('success', 'Compra parcelada registrada com sucesso!');
        }

        // Transferência: cria 2 transações (saída como expense, entrada como income)
        if ($type === TransactionType::Transfer) {
            $fromAccount = BankAccount::where('user_id', $userId)->findOrFail($data['bank_account_id']);
            $toAccount   = BankAccount::where('user_id', $userId)->findOrFail($data['transfer_to_account_id']);

            // Saída da conta origem
            Transaction::create([
                'user_id'         => $userId,
                'bank_account_id' => $fromAccount->id,
                'description'     => $data['description'] . ' → ' . $toAccount->name,
                'amount'          => $data['amount'],
                'type'            => TransactionType::Transfer,
                'status'          => TransactionStatus::from($data['status']),
                'date'            => $data['date'],
                'notes'           => $data['notes'] ?? null,
                'category_id'     => $data['category_id'] ?? null,
            ]);

            // Entrada na conta destino
            Transaction::create([
                'user_id'         => $userId,
                'bank_account_id' => $toAccount->id,
                'description'     => $data['description'] . ' ← ' . $fromAccount->name,
                'amount'          => $data['amount'],
                'type'            => TransactionType::Transfer,
                'status'          => TransactionStatus::from($data['status']),
                'date'            => $data['date'],
                'notes'           => $data['notes'] ?? null,
                'category_id'     => $data['category_id'] ?? null,
            ]);

            return redirect()->route('transactions.index')
                ->with('success', 'Transferência registrada com sucesso!');
        }

        // Transação normal
        $isRecurring = ! empty($data['is_recurring']);

        $transaction = Transaction::create([
            'user_id'                => $userId,
            'bank_account_id'        => $data['bank_account_id'] ?? null,
            'credit_card_id'         => $data['credit_card_id'] ?? null,
            'category_id'            => $data['category_id'] ?? null,
            'description'            => $data['description'],
            'amount'                 => $data['amount'],
            'type'                   => $type,
            'status'                 => TransactionStatus::from($data['status']),
            'date'                   => $data['date'],
            'notes'                  => $data['notes'] ?? null,
            'is_recurring'           => $isRecurring,
            'recurrence_rule'        => $isRecurring ? ($data['recurrence_rule'] ?? 'monthly') : null,
            'recurrence_end_date'    => $isRecurring ? ($data['recurrence_end_date'] ?? null) : null,
            'recurrence_occurrences' => $isRecurring ? ($data['recurrence_occurrences'] ?? null) : null,
        ]);

        if ($isRecurring) {
            $this->recurringService->createSeries($transaction, $data);
        }

        return redirect()->route('transactions.index')
            ->with('success', 'Transação criada com sucesso!');
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $data  = $request->validated();
        $scope = $data['recurrence_scope'] ?? 'only_this';
        unset($data['recurrence_scope']);

        if ($transaction->is_recurring && $scope !== 'only_this') {
            $this->recurringService->updateSeries($transaction, $data, $scope);
        } elseif ($transaction->installment_group_id && $scope !== 'only_this') {
            $this->installmentService->updateSeries($transaction, $data, $scope);
        } else {
            $transaction->update($data);
            if ($transaction->installment_group_id) {
                \App\Models\Installment::where('transaction_id', $transaction->id)->update(['amount' => $transaction->amount, 'status' => $transaction->status]);
            }
        }

        return redirect()->route('transactions.index')
            ->with('success', 'Transação atualizada com sucesso!');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $scope = request()->input('recurrence_scope', 'only_this');

        if ($transaction->is_recurring && $scope !== 'only_this') {
            $this->recurringService->deleteSeries($transaction, $scope);
        } elseif ($transaction->installment_group_id && $scope !== 'only_this') {
            $this->installmentService->deleteSeries($transaction, $scope);
        } else {
            if ($transaction->installment_group_id) {
                \App\Models\Installment::where('transaction_id', $transaction->id)->delete();
            }
            $transaction->delete();
        }

        return redirect()->route('transactions.index')
            ->with('success', 'Transação excluída com sucesso!');
    }

    public function markAsPaid(Transaction $transaction, Request $request): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $updateData = ['status' => TransactionStatus::Paid];

        // Se a transação não tem conta bancária e foi fornecida uma, associar agora
        $bankAccountId = $request->input('bank_account_id');
        if ($bankAccountId && !$transaction->bank_account_id) {
            // Valida que a conta pertence ao usuário antes de associar
            BankAccount::where('user_id', $transaction->user_id)->findOrFail($bankAccountId);
            $updateData['bank_account_id'] = (int) $bankAccountId;
        }

        $transaction->update($updateData);

        return redirect()->back()->with('success', 'Transação marcada como paga!');
    }

    public function undoPayment(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);

        if ($transaction->status !== TransactionStatus::Paid) {
            return back()->with('error', 'Esta transação não está paga.');
        }

        $transaction->update(['status' => TransactionStatus::Pending]);

        // Sincronização Google Calendar agora via TransactionObserver


        return back()->with('success', 'Pagamento desfeito! Transação voltou para pendente.');
    }

    public function syncCalendar(Transaction $transaction): RedirectResponse
    {
        if ($transaction->user_id !== Auth::id()) abort(403);

        if (! auth()->user()->google_calendar_enabled) {
            return back()->with('error', 'Google Calendar não conectado.');
        }

        if (! empty($transaction->google_event_id)) {
            return back()->with('error', 'Esta transação já possui evento na agenda.');
        }

        CreateCalendarEvent::dispatch(Transaction::class, $transaction->id, Auth::id());

        return back()->with('success', 'Transação enviada para sincronização com o Google Calendar!');
    }
}
