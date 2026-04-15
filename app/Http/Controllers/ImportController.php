<?php

namespace App\Http\Controllers;

use App\Enums\InstallmentStatus;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Jobs\CreateCalendarEvent;
use App\Jobs\ProcessStatementImport;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use DateTime;
use App\Services\Import\PdfParser;
use App\Services\Import\CsvParser;
use App\Services\Import\Boleto\BoletoParserFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ImportController extends Controller
{
    public function __construct(
        protected PdfParser $pdfParser,
        protected CsvParser $csvParser,
        protected BoletoParserFactory $boletoParserFactory,
    ) {}

    /**
     * Exibe a tela de upload. Lê invoiceDetails da session se existir (após redirect do upload).
     */
    public function index(): Response
    {
        $userId = Auth::id();

        $invoiceDetails = session("import_invoice_details_{$userId}");
        $matchedCardId  = session("import_matched_card_{$userId}");
        $matchedCard    = $matchedCardId ? CreditCard::find($matchedCardId) : null;
        $boletoDetails  = session("import_boleto_{$userId}");

        // Limpa da session após ler — os dados de itens ficam até o process()
        if ($invoiceDetails) {
            session()->forget(["import_invoice_details_{$userId}", "import_matched_card_{$userId}"]);
        }

        if ($boletoDetails) {
            session()->forget("import_boleto_{$userId}");
        }

        return Inertia::render('CreditCards/Import/Create', [
            'creditCards'    => CreditCard::byUser($userId)->active()->get(),
            'bankAccounts'   => BankAccount::byUser($userId)->active()->get(['id', 'name']),
            'invoiceDetails' => $invoiceDetails,
            'matchedCard'    => $matchedCard,
            'boletoDetails'  => $boletoDetails,
            'documentType'   => $boletoDetails ? 'boleto' : ($invoiceDetails ? 'invoice' : null),
        ]);
    }

    /**
     * Faz o upload e parseia o arquivo. Armazena na session e redireciona
     * de volta para index() — padrão POST-Redirect-GET do Inertia.
     */
    public function upload(Request $request): RedirectResponse
    {
        $request->validate([
            'file'        => 'required|file|mimes:pdf,csv,txt|max:10240',
            'import_type' => 'nullable|in:fatura,boleto',
        ]);

        $userId     = Auth::id();
        $file       = $request->file('file');
        $ext        = strtolower($file->getClientOriginalExtension());
        $importType = $request->input('import_type'); // 'fatura' | 'boleto' | null

        /** @var \App\DTO\ImportedInvoiceDTO|null $invoiceData */
        $invoiceData = null;
        $items       = collect();

        // 1. Parse do arquivo
        if ($ext === 'pdf') {
            $rawText = $this->pdfParser->getText($file->getRealPath());

            // ── Caminho BOLETO: escolha manual ou detecção automática ──
            // Quando o usuário escolhe "boleto", vai direto ao BoletoParserFactory
            // sem passar pelo InvoiceParserFactory (que retornaria transactions vazio)
            $isBoletoManual = $importType === 'boleto';

            if (! $isBoletoManual && $importType !== 'fatura') {
                // Auto-detecção: tenta parsear como fatura sem excluir BoletoDriver;
                // se o driver escolhido for Boleto, marca como boleto
                try {
                    $invoiceData = $this->pdfParser->parse($file->getRealPath());
                    $isBoletoManual = $invoiceData->bank?->name === 'Boleto';
                } catch (\Exception) {
                    // Nenhum driver encontrado — deixa cair no erro de itens vazios abaixo
                }
            }

            if ($isBoletoManual) {
                $storedPath = $file->store("imports/{$userId}", 'local');
                try {
                    $boletoDto = $this->boletoParserFactory->make($rawText)->parse($rawText);
                } catch (\Exception) {
                    return redirect()->route('imports.index')
                        ->with('error', 'Não foi possível ler este PDF como boleto. Verifique se o arquivo está correto.');
                }

                session([
                    "import_boleto_{$userId}" => [
                        'beneficiary' => $boletoDto->beneficiary,
                        'amount'      => $boletoDto->amount,
                        'dueDate'     => $boletoDto->dueDate?->format('Y-m-d'),
                        'cnpj'        => $boletoDto->cnpj,
                        'paymentCode' => $boletoDto->paymentCode,
                        'type'        => $boletoDto->type,
                        'filePath'    => $storedPath,
                        'fileName'    => $file->getClientOriginalName(),
                    ],
                ]);

                return redirect()->route('imports.index');
            }

            // ── Caminho FATURA DE CARTÃO ──
            // Exclui BoletoDriver para não contaminar o resultado com transactions vazio
            try {
                $invoiceData = $invoiceData
                    ?? $this->pdfParser->parse($file->getRealPath(), [\App\Services\Import\Invoice\BoletoDriver::class]);
            } catch (\Exception) {
                return redirect()->route('imports.index')
                    ->with('error', 'Não foi possível ler este PDF como fatura de cartão. Verifique o arquivo ou selecione "Boleto".');
            }

            $items = $invoiceData->transactions->map(fn ($t) => [
                'date'          => $t->date->format('Y-m-d'),
                'description'   => $t->description,
                'amount'        => $t->amount,
                'is_parcelado'  => $t->isParcelado,
                'parcela_atual' => $t->parcelaAtual,
                'parcela_total' => $t->parcelaTotal,
                'status_import' => 'new',
                'category_id'   => null,
                'category_name' => null,
            ]);
        } else {
            $items = $this->csvParser->parse($file->getRealPath());
        }

        Log::info("Import upload: {$items->count()} itens de {$file->getClientOriginalName()}");

        if ($items->isEmpty()) {
            return redirect()->route('imports.index')
                ->with('error', 'Nenhuma transação encontrada no arquivo. Verifique se o formato é suportado.');
        }

        // 2. Parseia limites de crédito
        $creditLimit    = null;
        $availableLimit = null;

        if ($invoiceData?->card?->limit) {
            $creditLimit = (float) $invoiceData->card->limit;
            if ($creditLimit <= 0) $creditLimit = null;
        }

        if (isset($invoiceData?->card?->availableLimit) && $invoiceData->card->availableLimit !== null) {
            $availableLimit = (float) $invoiceData->card->availableLimit;
        } elseif ($creditLimit !== null && $invoiceData?->card?->used !== null) {
            $availableLimit = max(0, $creditLimit - (float) $invoiceData->card->used);
        }

        $bank        = $invoiceData?->bank?->name;
        $lastFour    = $invoiceData?->card?->lastFourDigits;
        $totalAmount = $invoiceData?->invoice?->totalAmount ?? $items->sum('amount');
        $cardName    = $invoiceData?->card?->name;
        $brand       = $invoiceData?->card?->brand;
        $closingDay  = $invoiceData?->card?->closingDay;
        $dueDay      = $invoiceData?->card?->dueDay;

        // Data de vencimento completa (Y-m-d) extraída diretamente do PDF, preservando o mês real.
        // Armazenada em chave SEPARADA da session para sobreviver ao forget() de index().
        // Não pode ser reconstruída depois apenas com dueDay pois o mês de referência das
        // transações pode diferir do mês do vencimento (ex: fatura fev com vencimento em mar).
        $dueDateFull = null;
        if ($invoiceData?->invoice?->dueDateInvoice) {
            try {
                $dueDateFull = \Carbon\Carbon::parse($invoiceData->invoice->dueDateInvoice)->format('Y-m-d');
            } catch (\Exception) {}
        }

        // 3. Tenta identificar cartão pelo lastFour
        $matchedCard = null;
        if ($lastFour) {
            $matchedCard = CreditCard::byUser($userId)
                ->where('last_four_digits', $lastFour)
                ->first();
        }

        // 4. Salva o arquivo em disco para auditoria
        $storedPath = $file->store("imports/{$userId}", 'local');

        // 5. Persiste na session — processamento pesado (dedup + IA) ocorre no Job
        //
        // ATENÇÃO: import_invoice_details é deletado por index() ao renderizar a confirmação.
        // Por isso, dueDate fica em chave própria (import_due_date) que sobrevive até process().
        session([
            "import_preview_{$userId}"         => $items->toArray(),
            "import_filename_{$userId}"        => $file->getClientOriginalName(),
            "import_file_path_{$userId}"       => $storedPath,
            "import_matched_card_{$userId}"    => $matchedCard?->id,
            "import_due_date_{$userId}"        => $dueDateFull,    // ← chave separada, não apagada por index()
            "import_total_amount_{$userId}"    => $totalAmount,    // ← chave separada, não apagada por index()
            "import_invoice_details_{$userId}" => [
                'bank'           => $bank,
                'lastFour'       => $lastFour,
                'totalAmount'    => $totalAmount,
                'itemCount'      => $items->count(),
                'isValidSum'     => $invoiceData?->isValidSum ?? true,
                'cardName'       => $cardName,
                'brand'          => $brand,
                'closingDay'     => $closingDay,
                'dueDay'         => $dueDay,
                'creditLimit'    => $creditLimit,
                'availableLimit' => $availableLimit,
            ],
        ]);

        // POST → Redirect → GET
        return redirect()->route('imports.index');
    }

    /**
     * Confirmação do modal: cria o cartão se necessário, cria o CreditCardStatement,
     * dispara o Job em background e redireciona para a tela de acompanhamento.
     */
    public function process(Request $request): RedirectResponse
    {
        $userId = Auth::id();
        $items  = collect(session("import_preview_{$userId}", []));

        if ($items->isEmpty()) {
            return redirect()->route('imports.index')
                ->with('error', 'Sessão expirada. Faça o upload novamente.');
        }

        // Criar novo cartão se necessário
        if ($request->filled('new_card')) {
            $cardData = $request->input('new_card');
            $creditLimit = (float) $cardData['credit_limit'];
            $availableLimit = isset($cardData['available_limit']) && $cardData['available_limit'] !== '' 
                ? (float) $cardData['available_limit'] 
                : $creditLimit;
                
            $limitAdjustment = $availableLimit - $creditLimit;

            $card = CreditCard::create([
                'user_id'          => $userId,
                'name'             => $cardData['name'],
                'brand'            => $cardData['brand'] ?? null,
                'last_four_digits' => $cardData['last_four_digits'] ?? null,
                'credit_limit'     => $creditLimit,
                'available_limit'  => $availableLimit,
                'limit_adjustment' => $limitAdjustment,
                'closing_day'      => (int) $cardData['closing_day'],
                'due_day'          => (int) $cardData['due_day'],
                'bank_account_id'  => $cardData['bank_account_id'] ?: null,
                'color'            => $cardData['color'] ?? '#6366f1',
                'is_active'        => true,
            ]);
            $creditCardId = $card->id;
        } else {
            $request->validate(['credit_card_id' => 'required|exists:credit_cards,id']);
            $creditCardId = (int) $request->input('credit_card_id');
            // Valida que o cartão pertence ao usuário autenticado
            CreditCard::byUser($userId)->findOrFail($creditCardId);
        }

        // Infere o mês de referência a partir das datas dos itens
        $months = $items->map(fn ($i) => substr($i['date'], 0, 7))->countBy();
        $referenceMonth = $months->sortDesc()->keys()->first() ?? now()->format('Y-m');

        // Usa o total extraído do PDF (chave separada que sobrevive ao forget() de index()).
        // Fallback para soma dos itens se o PDF não informou o total.
        $totalAmount = session("import_total_amount_{$userId}") ?? $items->sum('amount');
        $filePath    = session("import_file_path_{$userId}");
        $fileName    = session("import_filename_{$userId}", 'fatura');
        $invoiceDetails = session("import_invoice_details_{$userId}", []);

        // Obter os dias de vencimento e fechamento (byUser garante ownership)
        $card       = CreditCard::byUser($userId)->find($creditCardId);
        $dueDay     = $invoiceDetails['dueDay']     ?? $card?->due_day     ?? null;
        $closingDay = $invoiceDetails['closingDay'] ?? $card?->closing_day ?? null;

        // dueDate: usa a data completa do PDF (chave separada que sobrevive ao index()).
        // Fallback: referenceMonth + 1 mês + dueDay (padrão BR: fatura de fev vence em mar).
        $dueDateFromPdf = session("import_due_date_{$userId}");
        $dueDate = null;
        if ($dueDateFromPdf) {
            $dueDate = $dueDateFromPdf;
        } elseif ($dueDay) {
            $dueDate = \Carbon\Carbon::createFromFormat('Y-m', $referenceMonth)->addMonth()->setDay($dueDay)->format('Y-m-d');
        }

        $closingDate = null;
        if ($closingDay) {
            $closingDate = \Carbon\Carbon::createFromFormat('Y-m', $referenceMonth)->setDay($closingDay)->format('Y-m-d');
        }

        // Cria ou atualiza o statement (unique: credit_card_id + reference_month)
        $statement = CreditCardStatement::updateOrCreate(
            ['credit_card_id' => $creditCardId, 'reference_month' => $referenceMonth],
            [
                'user_id'       => $userId,
                'due_date'      => $dueDate,
                'closing_date'  => $closingDate,
                'total_amount'  => $totalAmount,
                'paid_amount'   => 0,
                'status'        => 'open',
                'file_path'     => $filePath,
                'file_name'     => $fileName,
                'import_status' => 'processing',
                'raw_items'     => $items->toArray(),
                'parsed_items'  => null,
                'imported_at'   => now(),
            ]
        );

        // Limpa a session
        session()->forget([
            "import_preview_{$userId}",
            "import_filename_{$userId}",
            "import_file_path_{$userId}",
            "import_invoice_details_{$userId}",
            "import_matched_card_{$userId}",
            "import_due_date_{$userId}",
            "import_total_amount_{$userId}",
        ]);

        // Sincronização Google Calendar agora via CreditCardStatementObserver


        // Processa o Job de forma síncrona (sem necessidade de queue worker)
        ProcessStatementImport::dispatchSync($statement->id);

        return redirect()->route('imports.review', $statement->id);
    }

    /**
     * Processa um boleto importado: cria uma transação pendente com campos de boleto.
     */
    public function processBoleto(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'description'          => 'required|string|max:255',
            'amount'               => 'required|numeric|min:0.01',
            'due_date'             => 'required|date',
            'payment_code'         => 'nullable|string|max:150',
            'beneficiary_name'     => 'nullable|string|max:255',
            'beneficiary_document' => 'nullable|string|max:20',
            'category_id'          => 'nullable|exists:categories,id',
        ]);

        $userId = Auth::id();

        Transaction::create([
            'user_id'              => $userId,
            'bank_account_id'      => null,
            'category_id'          => $data['category_id'] ?? null,
            'description'          => $data['description'],
            'amount'               => $data['amount'],
            'type'                 => TransactionType::Expense,
            'status'               => TransactionStatus::Pending,
            'date'                 => $data['due_date'],
            'payment_code'         => $data['payment_code'] ?? null,
            'beneficiary_name'     => $data['beneficiary_name'] ?? null,
            'beneficiary_document' => $data['beneficiary_document'] ?? null,
            'is_imported'          => true,
        ]);

        return redirect()->route('transactions.index')
            ->with('success', 'Boleto importado com sucesso!');
    }

    /**
     * Exibe a tela de acompanhamento ou revisão, dependendo do import_status.
     */
    public function review(CreditCardStatement $statement): Response|RedirectResponse
    {
        if ($statement->user_id !== Auth::id()) {
            abort(403);
        }

        if ($statement->import_status === 'processing') {
            return Inertia::render('CreditCards/Import/Waiting', [
                'statementId' => $statement->id,
            ]);
        }

        if ($statement->import_status === 'failed') {
            return redirect()->route('imports.index')
                ->with('error', 'Falha ao processar a fatura. Por favor, tente novamente.');
        }

        $allCategories = Category::where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', Auth::id()))
            ->where('type', 'expense')
            ->get();

        return Inertia::render('CreditCards/Import/Review', [
            'items'        => $statement->parsed_items ?? [],
            'creditCardId' => $statement->credit_card_id,
            'fileName'     => $statement->file_name ?? basename($statement->file_path ?? 'fatura'),
            'categories'   => $allCategories,
            'statementId'  => $statement->id,
        ]);
    }

    /**
     * Retorna o status atual do import para polling do frontend.
     */
    public function statusJson(CreditCardStatement $statement): JsonResponse
    {
        if ($statement->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json([
            'import_status' => $statement->import_status,
        ]);
    }

    /**
     * Salva as transações aprovadas.
     * Itens parcelados geram InstallmentGroup completo; demais geram Transaction avulsa.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'statement_id'               => 'nullable|exists:credit_card_statements,id',
            'credit_card_id'             => 'required|exists:credit_cards,id',
            'transactions'               => 'required|array',
            'transactions.*.date'        => 'required|date',
            'transactions.*.description' => 'required|string',
            'transactions.*.amount'      => 'required|numeric',
        ]);

        $userId       = Auth::id();
        $creditCardId = (int) $request->input('credit_card_id');

        $statementId = $request->filled('statement_id') ? (int) $request->input('statement_id') : null;

        $transactions = (array) $request->input('transactions', []);

        $count = DB::transaction(function () use ($transactions, $userId, $creditCardId, $statementId) {
            $count = 0;
            foreach ($transactions as $tx) {
                $isParcelado  = !empty($tx['is_parcelado']);
                $parcelaTotal = (int) ($tx['parcela_total'] ?? 1);

                if ($isParcelado && $parcelaTotal > 1) {
                    $created = $this->createInstallmentGroup($tx, $userId, $creditCardId, $statementId);
                    if ($created) $count++;
                } else {
                    $created = $this->createSingleTransaction($tx, $userId, $creditCardId, $statementId);
                    if ($created) $count++;
                }
            }
            return $count;
        });

        // Marca o statement como concluído
        if ($statementId) {
            CreditCardStatement::where('id', $statementId)
                ->update(['import_status' => 'completed']);
        }

        return redirect()->route('transactions.index')
            ->with('success', "{$count} itens importados com sucesso!");
    }

    /**
     * Cria InstallmentGroup + N Transactions + N Installments a partir de uma parcela importada.
     * Se o grupo já existir (mesmo cartão + descrição + total), apenas cria as parcelas faltantes.
     * Faturas futuras são criadas via resolveOrCreateFutureStatement com due_date/closing_date
     * calculados a partir do cartão, e seu total_amount é incrementado ao final.
     * Retorna true se criou ou atualizou, false se já existia completamente (dedup).
     */
    private function createInstallmentGroup(array $tx, int $userId, int $creditCardId, ?int $statementId = null): bool
    {
        $n       = (int) ($tx['parcela_total'] ?? 1);
        $current = (int) ($tx['parcela_atual'] ?? 1);
        $amount  = (float) $tx['amount'];

        $hash = Transaction::generateImportHash($tx['date'], (int) round($amount * 100), $tx['description']);
        if (Transaction::where('user_id', $userId)->where('import_hash', $hash)->exists()) {
            return false;
        }

        $currentDue = new DateTime($tx['date']);
        $firstDue   = (clone $currentDue)->modify('-' . ($current - 1) . ' months');

        $baseDesc = trim(preg_replace('/\s*\b\d{1,3}\/\d{1,3}\b\s*/', ' ', $tx['description']));
        if (empty($baseDesc)) {
            $baseDesc = $tx['description'];
        }

        $totalAmount = round($amount * $n, 2);

        // Carrega o cartão para obter due_day e closing_day (usados nas faturas futuras)
        $card = CreditCard::find($creditCardId);

        // Check if group already exists (same card + base description + total amount)
        $group = InstallmentGroup::where('user_id', $userId)
            ->where('credit_card_id', $creditCardId)
            ->where('description', $baseDesc)
            ->where('total_amount', $totalAmount)
            ->where('total_installments', $n)
            ->first();

        if ($group) {
            // Group exists — find which installment numbers are already present
            $existingNumbers = Installment::where('installment_group_id', $group->id)
                ->pluck('number')
                ->flip();

            // Only create installments that don't exist yet, starting from current
            $createdAny  = false;
            $stmtAmounts = []; // [stmtId => totalAmount] para atualizar faturas futuras

            for ($i = $current; $i <= $n; $i++) {
                if ($existingNumbers->has($i)) {
                    continue;
                }

                $dueDate   = (clone $firstDue)->modify('+' . ($i - 1) . ' months');
                $isCurrent = $i === $current;
                $status    = $isCurrent ? TransactionStatus::Paid : TransactionStatus::Pending;

                $monthKey = $dueDate->format('Y-m');
                if ($isCurrent) {
                    $stmtForMonth = $statementId;
                } else {
                    // Parcelas futuras: garante que a fatura do mês existe com datas corretas
                    $stmtForMonth = $this->resolveOrCreateFutureStatement(
                        $creditCardId, $userId, $monthKey, $card
                    );
                }

                $transaction = Transaction::create([
                    'user_id'                  => $userId,
                    'credit_card_id'           => $creditCardId,
                    'category_id'              => $tx['category_id'] ?? null,
                    'installment_group_id'     => $group->id,
                    'description'              => "{$baseDesc} ({$i}/{$n})",
                    'amount'                   => $amount,
                    'type'                     => TransactionType::CreditCard,
                    'status'                   => $status,
                    'date'                     => $dueDate->format('Y-m-d'),
                    'is_imported'              => $isCurrent,
                    'import_hash'              => $isCurrent ? $hash : null,
                    'credit_card_statement_id' => $stmtForMonth,
                ]);

                Installment::create([
                    'installment_group_id' => $group->id,
                    'transaction_id'       => $transaction->id,
                    'number'               => $i,
                    'amount'               => $amount,
                    'due_date'             => $dueDate->format('Y-m-d'),
                    'status'               => $status,
                ]);

                // Acumula o valor para incrementar total_amount da fatura futura
                if (! $isCurrent && $stmtForMonth) {
                    $stmtAmounts[$stmtForMonth] = ($stmtAmounts[$stmtForMonth] ?? 0) + $amount;
                }

                $createdAny = true;
            }

            // Atualiza total_amount das faturas futuras criadas/encontradas.
            // Guard: nunca incrementa o statement atual — pode ocorrer quando o item tem
            // data no mês anterior ao mês de referência (ex: 2026-01 numa fatura 02/2026)
            // e sua próxima parcela cai em 2026-02, fazendo resolveOrCreateFutureStatement
            // retornar o mesmo $statementId.
            foreach ($stmtAmounts as $stmtId => $amt) {
                if ($statementId !== null && $stmtId === $statementId) continue;
                CreditCardStatement::where('id', $stmtId)->increment('total_amount', round($amt, 2));
            }

            return $createdAny;
        }

        // Group does not exist — create it from scratch
        $group = InstallmentGroup::create([
            'user_id'            => $userId,
            'credit_card_id'     => $creditCardId,
            'category_id'        => $tx['category_id'] ?? null,
            'description'        => $baseDesc,
            'total_amount'       => $totalAmount,
            'installment_amount' => $amount,
            'total_installments' => $n,
            'paid_installments'  => $current,
            'start_date'         => $firstDue->format('Y-m-d'),
            'status'             => InstallmentStatus::Active,
        ]);

        $stmtAmounts = []; // [stmtId => totalAmount] para atualizar faturas futuras

        for ($i = 1; $i <= $n; $i++) {
            $dueDate   = (clone $firstDue)->modify('+' . ($i - 1) . ' months');
            $isPaid    = $i <= $current;
            $isCurrent = $i === $current;
            $status    = $isPaid ? TransactionStatus::Paid : TransactionStatus::Pending;

            // Resolve statement para o mês desta parcela:
            // - Parcela atual   → fatura importada
            // - Parcela futura  → cria fatura do mês com datas corretas (se não existir)
            // - Parcela passada → busca sem criar (fatura já deveria existir ou fica null)
            $monthKey = $dueDate->format('Y-m');
            if ($isCurrent) {
                $stmtForMonth = $statementId;
            } elseif ($i > $current) {
                $stmtForMonth = $this->resolveOrCreateFutureStatement(
                    $creditCardId, $userId, $monthKey, $card
                );
            } else {
                $stmtForMonth = CreditCardStatement::where('credit_card_id', $creditCardId)
                    ->where('reference_month', $monthKey)
                    ->value('id');
            }

            $transaction = Transaction::create([
                'user_id'                  => $userId,
                'credit_card_id'           => $creditCardId,
                'category_id'              => $tx['category_id'] ?? null,
                'installment_group_id'     => $group->id,
                'description'              => "{$baseDesc} ({$i}/{$n})",
                'amount'                   => $amount,
                'type'                     => TransactionType::CreditCard,
                'status'                   => $status,
                'date'                     => $dueDate->format('Y-m-d'),
                'is_imported'              => $isCurrent,
                'import_hash'              => $isCurrent ? $hash : null,
                'credit_card_statement_id' => $stmtForMonth,
            ]);

            Installment::create([
                'installment_group_id' => $group->id,
                'transaction_id'       => $transaction->id,
                'number'               => $i,
                'amount'               => $amount,
                'due_date'             => $dueDate->format('Y-m-d'),
                'status'               => $status,
            ]);

            // Acumula o valor para incrementar total_amount da fatura futura
            if ($i > $current && $stmtForMonth) {
                $stmtAmounts[$stmtForMonth] = ($stmtAmounts[$stmtForMonth] ?? 0) + $amount;
            }
        }

        // Atualiza total_amount das faturas futuras criadas/encontradas.
        // Guard: nunca incrementa o statement atual — pode ocorrer quando o item tem
        // data no mês anterior ao mês de referência (ex: 2026-01 numa fatura 02/2026)
        // e sua próxima parcela cai em 2026-02, fazendo resolveOrCreateFutureStatement
        // retornar o mesmo $statementId.
        foreach ($stmtAmounts as $stmtId => $amt) {
            if ($statementId !== null && $stmtId === $statementId) continue;
            CreditCardStatement::where('id', $stmtId)->increment('total_amount', round($amt, 2));
        }

        return true;
    }

    /**
     * Garante que existe uma CreditCardStatement para o mês informado.
     * Se não existir, cria com due_date e closing_date calculados a partir
     * do due_day e closing_day do cartão.
     */
    private function resolveOrCreateFutureStatement(
        int $creditCardId,
        int $userId,
        string $monthKey,
        ?CreditCard $card
    ): int {
        $dueDay     = $card?->due_day;
        $closingDay = $card?->closing_day;

        // Padrão BR: fatura de referência YYYY-MM vence no mês seguinte.
        // Ex: fatura Março (2026-03) vence em Abril → 2026-04-25.
        // closing_date fica dentro do próprio monthKey (fecha em março, vence em abril).
        return CreditCardStatement::firstOrCreate(
            ['credit_card_id' => $creditCardId, 'reference_month' => $monthKey],
            [
                'user_id'      => $userId,
                'status'       => 'open',
                'total_amount' => 0,
                'paid_amount'  => 0,
                'due_date'     => $dueDay
                    ? \Carbon\Carbon::createFromFormat('Y-m', $monthKey)->addMonth()->setDay($dueDay)->format('Y-m-d')
                    : null,
                'closing_date' => $closingDay
                    ? \Carbon\Carbon::createFromFormat('Y-m', $monthKey)->setDay($closingDay)->format('Y-m-d')
                    : null,
            ]
        )->id;
    }

    /**
     * Cria uma única Transaction avulsa (não parcelada).
     * Retorna true se criou, false se já existia (dedup).
     */
    private function createSingleTransaction(array $tx, int $userId, int $creditCardId, ?int $statementId = null): bool
    {
        $amountCents = (int) round((float) $tx['amount'] * 100);
        $hash        = Transaction::generateImportHash($tx['date'], $amountCents, $tx['description']);

        if (Transaction::where('user_id', $userId)->where('import_hash', $hash)->exists()) {
            return false;
        }

        Transaction::create([
            'user_id'                    => $userId,
            'credit_card_id'             => $creditCardId,
            'credit_card_statement_id'   => $statementId,
            'category_id'                => $tx['category_id'] ?? null,
            'description'                => $tx['description'],
            'amount'                     => $tx['amount'],
            'type'                       => TransactionType::CreditCard,
            'status'                     => TransactionStatus::Paid,
            'date'                       => $tx['date'],
            'is_imported'                => true,
            'import_hash'                => $hash,
        ]);

        return true;
    }
}
