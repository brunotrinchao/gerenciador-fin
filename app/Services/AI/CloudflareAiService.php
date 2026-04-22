<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class CloudflareAiService
{
    protected string $accountId;
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->accountId = env('CLOUDFLARE_ACCOUNT_ID');
        $this->apiKey    = env('CLOUDFLARE_API_KEY');
        $this->model     = env('CLOUDFLARE_AI_MODEL', '@cf/meta/llama-3.1-8b-instruct');
    }

    /**
     * Envia prompt para Cloudflare Workers AI.
     */
    public function prompt(string $systemPrompt, string $userPrompt): ?string
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/ai/run/{$this->model}";

        try {
            $response = Http::withToken($this->apiKey)
                ->post($url, [
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ]
                ]);

            if ($response->failed()) {
                Log::error('Cloudflare AI Error', [
                    'status' => $response->status(),
                    'body'   => $response->body()
                ]);
                return null;
            }

            return $response->json('result.response');

        } catch (Exception $e) {
            Log::error('Cloudflare AI Exception: ' . $e->getMessage());
            return null;
        }
    }

    public function generateMonthlyAnalysis(\App\Models\User $user, int $month, int $year): string
    {
        try {
            $transactions = \App\Models\Transaction::where('user_id', $user->id)
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->where('status', \App\Enums\TransactionStatus::Paid)
                ->with('category')
                ->get();

            $incomeTypes  = [\App\Enums\TransactionType::Income, \App\Enums\TransactionType::InvestmentOut];
            $expenseTypes = [\App\Enums\TransactionType::Expense, \App\Enums\TransactionType::CreditCard, \App\Enums\TransactionType::InvestmentIn];

            $totalIncome  = $transactions->whereIn('type', $incomeTypes)->sum('amount');
            $totalExpense = $transactions->whereIn('type', $expenseTypes)->sum('amount');
            $savingsRate  = $totalIncome > 0 ? round((($totalIncome - $totalExpense) / $totalIncome) * 100, 1) : 0;

            $byCategory = $transactions
                ->filter(fn($t) => in_array($t->type, $expenseTypes))
                ->groupBy(fn($t) => $t->category?->name ?? 'Sem categoria')
                ->map(fn($txs) => $txs->sum('amount'))
                ->sortDesc()
                ->take(5);

            $monthName = \Carbon\Carbon::create($year, $month, 1)->locale('pt_BR')->monthName;

            $systemPrompt = "Você é um consultor financeiro pessoal brasileiro. Forneça uma análise financeira estruturada em Markdown.";
            
            $userPrompt = "Analise os dados financeiros de {$monthName}/{$year}:\n\n"
                . "- Receita total (incluindo resgates): R$ " . number_format((float) $totalIncome, 2, ',', '.') . "\n"
                . "- Despesas totais (incluindo aportes e cartão): R$ " . number_format((float) $totalExpense, 2, ',', '.') . "\n"
                . "- Taxa de poupança: {$savingsRate}%\n"
                . "- Top categorias de gastos:\n";

            foreach ($byCategory as $cat => $amount) {
                $userPrompt .= "  • {$cat}: R$ " . number_format((float) $amount, 2, ',', '.') . "\n";
            }

            $userPrompt .= "\nForneça em formato estruturado:\n"
                . "## Resumo do Mês\n[2-3 frases]\n\n"
                . "## Insights\n[3 insights específicos com valores]\n\n"
                . "## Recomendações\n[2 recomendações práticas para o próximo mês]\n\n"
                . "Seja direto, use linguagem informal e mostre valores em R$.";

            return $this->prompt($systemPrompt, $userPrompt) ?? 'Não foi possível obter análise da IA.';
        } catch (\Throwable $e) {
            Log::error('CloudflareAiService::generateMonthlyAnalysis falhou: ' . $e->getMessage());
            return 'Serviço de IA temporariamente indisponível.';
        }
    }

    /**
     * Gera análise profunda de saúde financeira.
     */
    public function analyzeFinancialHealth(array $healthData): string
    {
        try {
            $systemPrompt = "Você é um consultor financeiro CFP (Certified Financial Planner). Analise os indicadores de saúde financeira e forneça um plano de ação estratégico.";
            
            $userPrompt = "Dados de Saúde Financeira:\n"
                . "- Score Total: {$healthData['total']}/100 (Grau: {$healthData['grade']})\n"
                . "- Taxa de Poupança: {$healthData['components']['savings_rate']['value']}{$healthData['components']['savings_rate']['unit']}\n"
                . "- Uso de Crédito: {$healthData['components']['credit_utilization']['value']}{$healthData['components']['credit_utilization']['unit']}\n"
                . "- Reserva de Emergência: {$healthData['components']['emergency_fund']['value']} {$healthData['components']['emergency_fund']['unit']}\n"
                . "- Aderência ao Orçamento: {$healthData['components']['budget_adherence']['value']} {$healthData['components']['budget_adherence']['unit']}\n\n"
                . "Forneça:\n"
                . "## Diagnóstico\n[Análise técnica do estado atual]\n\n"
                . "## Pontos Críticos\n[O que precisa de atenção imediata]\n\n"
                . "## Plano de Ação\n[Passos práticos para melhorar o score]\n\n"
                . "Seja profissional, motivador e use Markdown.";

            return $this->prompt($systemPrompt, $userPrompt) ?? 'Não foi possível obter análise da IA.';
        } catch (\Throwable $e) {
            Log::error('CloudflareAiService::analyzeFinancialHealth falhou: ' . $e->getMessage());
            return 'Serviço de IA temporariamente indisponível.';
        }
    }

    /**
     * Categoriza múltiplas descrições de transações em lote.
     * Retorna mapa: ['descrição' => 'categoria']
     */
    public function categorizeBatch(array $descriptions, array $categories): array
    {
        if (empty($descriptions) || empty($categories)) {
            return [];
        }

        try {
            $categoryList = implode(', ', $categories);
            $descList = implode("\n", array_map(
                fn ($i, $d) => "{$i}. {$d}",
                range(1, \count($descriptions)),
                $descriptions
            ));

            $systemPrompt = "Você é assistente de categorização financeira. Responda APENAS JSON: {\"1\": \"categoria\", \"2\": \"categoria\", ...}. Use APENAS categorias da lista: {$categoryList}. Se falhar, use 'Outros Gastos'. Sem explicações.";
            
            $userPrompt = "Transações:\n{$descList}";

            $result = $this->prompt($systemPrompt, $userPrompt);

            if (!$result) return [];

            $clean = preg_replace('/```(?:json)?\s*/i', '', $result);
            $clean = preg_replace('/```/', '', $clean);
            $clean = trim($clean);

            if (preg_match('/\{.*\}/s', $clean, $matches)) {
                $mapping = json_decode($matches[0], true) ?? [];
                $final   = [];
                foreach ($mapping as $index => $category) {
                    $idx = (int) $index - 1;
                    if (isset($descriptions[$idx])) {
                        $final[$descriptions[$idx]] = $category;
                    }
                }
                return $final;
            }

            return [];
        } catch (\Throwable $e) {
            Log::error('CloudflareAiService::categorizeBatch falhou: ' . $e->getMessage());
            return [];
        }
    }
}
