<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;
    protected string $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', '');
    }

    /**
     * Categoriza múltiplas descrições de transações em lote.
     * Retorna mapa: ['descrição' => 'categoria'] ou [] em caso de falha.
     */
    public function categorizeBatch(array $descriptions, array $categories): array
    {
        if (empty($this->apiKey) || empty($descriptions) || empty($categories)) {
            return [];
        }

        try {
            $categoryList = implode(', ', $categories);
            $descList = implode("\n", array_map(
                fn ($i, $d) => "{$i}. {$d}",
                range(1, \count($descriptions)),
                $descriptions
            ));

            $prompt = <<<PROMPT
Você é um assistente de categorização financeira. Categorize cada transação abaixo usando APENAS as categorias disponíveis.

Categorias disponíveis: {$categoryList}

Transações para categorizar:
{$descList}

Responda APENAS com JSON no formato:
{"1": "categoria", "2": "categoria", ...}

Regras:
- Use exatamente o nome da categoria como fornecido
- Se não conseguir categorizar, use "Outros Gastos"
- Não adicione explicações, apenas o JSON
PROMPT;

            $response = Http::withHeader('x-goog-api-key', $this->apiKey)
                ->timeout(15)
                ->post($this->endpoint, [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.1,
                        'maxOutputTokens' => 1024,
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('GeminiService: resposta não-OK', ['status' => $response->status()]);
                return [];
            }

            $text = $response->json('candidates.0.content.parts.0.text', '');

            // Remove blocos markdown (```json ... ```) e extrai o JSON
            $clean = preg_replace('/```(?:json)?\s*/i', '', $text);
            $clean = preg_replace('/```/', '', $clean);
            $clean = trim($clean);

            // Tenta extrair o objeto JSON da resposta (suporta multi-linha)
            if (preg_match('/\{.*\}/s', $clean, $matches)) {
                $mapping = json_decode($matches[0], true) ?? [];

                // Reconstrói mapeamento usando índices para as descrições originais
                $result = [];
                foreach ($mapping as $index => $category) {
                    $idx = (int) $index - 1;
                    if (isset($descriptions[$idx])) {
                        $result[$descriptions[$idx]] = $category;
                    }
                }
                return $result;
            }

            return [];
        } catch (\Throwable $e) {
            Log::error('GeminiService::categorizeBatch falhou: ' . $e->getMessage());
            return []; // Fallback gracioso — nunca quebra o fluxo
        }
    }

    /**
     * Gera análise mensal financeira com IA para o usuário.
     */
    public function generateMonthlyAnalysis(\App\Models\User $user, int $month, int $year): string
    {
        if (empty($this->apiKey)) {
            return 'Serviço de IA não configurado. Configure GEMINI_API_KEY no .env';
        }

        try {
            $transactions = \App\Models\Transaction::where('user_id', $user->id)
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->with('category')
                ->get();

            $incomeTypes  = [\App\Enums\TransactionType::Income->value];
            $expenseTypes = [\App\Enums\TransactionType::Expense->value, \App\Enums\TransactionType::CreditCard->value];

            $totalIncome  = $transactions->whereIn('type', array_map(fn($t) => \App\Enums\TransactionType::from($t), $incomeTypes))->sum('amount');
            $totalExpense = $transactions->whereIn('type', array_map(fn($t) => \App\Enums\TransactionType::from($t), $expenseTypes))->sum('amount');
            $savingsRate  = $totalIncome > 0 ? round((($totalIncome - $totalExpense) / $totalIncome) * 100, 1) : 0;

            $byCategory = $transactions
                ->filter(fn($t) => in_array($t->type->value, $expenseTypes))
                ->groupBy(fn($t) => $t->category?->name ?? 'Sem categoria')
                ->map(fn($txs) => $txs->sum('amount'))
                ->sortDesc()
                ->take(5);

            $monthName = \Carbon\Carbon::create($year, $month, 1)->locale('pt_BR')->monthName;

            $prompt = "Você é um consultor financeiro pessoal brasileiro. Analise os dados financeiros de {$monthName}/{$year}:\n\n"
                . "- Receita total: R$ " . number_format((float) $totalIncome, 2, ',', '.') . "\n"
                . "- Despesas totais: R$ " . number_format((float) $totalExpense, 2, ',', '.') . "\n"
                . "- Taxa de poupança: {$savingsRate}%\n"
                . "- Top categorias de gastos:\n";

            foreach ($byCategory as $cat => $amount) {
                $prompt .= "  • {$cat}: R$ " . number_format((float) $amount, 2, ',', '.') . "\n";
            }

            $prompt .= "\nForneça em formato estruturado:\n"
                . "## Resumo do Mês\n[2-3 frases]\n\n"
                . "## Insights\n[3 insights específicos com valores]\n\n"
                . "## Recomendações\n[2 recomendações práticas para o próximo mês]\n\n"
                . "Seja direto, use linguagem informal e mostre valores em R$.";

            $response = Http::withHeader('x-goog-api-key', $this->apiKey)
                ->timeout(30)
                ->post($this->endpoint, [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 2048],
                ]);

            return $response->json('candidates.0.content.parts.0.text', 'Não foi possível obter análise da IA.');
        } catch (\Throwable $e) {
            Log::error('GeminiService::generateMonthlyAnalysis falhou: ' . $e->getMessage());
            return 'Serviço de IA temporariamente indisponível.';
        }
    }

    /**
     * Chat financeiro com contexto do usuário.
     */
    public function chat(string $message, string $context = ''): string
    {
        if (empty($this->apiKey)) {
            return 'Serviço de IA não configurado. Configure GEMINI_API_KEY no .env';
        }

        try {
            $fullMessage = $context
                ? "Contexto financeiro do usuário:\n{$context}\n\nPergunta: {$message}"
                : $message;

            $response = Http::withHeader('x-goog-api-key', $this->apiKey)
                ->timeout(20)
                ->post($this->endpoint, [
                    'contents' => [
                        ['parts' => [['text' => $fullMessage]]]
                    ],
                    'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 2048],
                ]);

            return $response->json('candidates.0.content.parts.0.text', 'Não foi possível obter resposta da IA.');
        } catch (\Throwable $e) {
            Log::error('GeminiService::chat falhou: ' . $e->getMessage());
            return 'Serviço de IA temporariamente indisponível.';
        }
    }
}
