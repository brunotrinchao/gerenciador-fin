<?php

namespace App\Ai\Agents;

use App\Models\Category;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Collection;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Laravel\Ai\Providers\Provider;
use Stringable;

#[Timeout(180)]
class InvoiceDataExtractor implements Agent
{
    use Promptable;
    private Collection $category;

    public function __construct()
    {
        $this->category = Category::all("id","name");
    }

    public function model(){
        return config('ai.providers.cloudflare.model');
    }

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        $categoriaStr = $this->category->pluck('name')->implode(', ');
        return <<<'PROMPT'
Você é um extrator de dados bancários especializado em faturas de cartão de crédito brasileiro.


Receba o texto extraido do PDF de fatura de cartão de crédito e retorne um JSON estruturado com:
1. Dados do cartão (nome, bandeira, últimos 4 dígitos, dia de fechamento, dia de vencimento, limite, valor utilizado)
2. Dados do banco emissor (nome, CNPJ)
3. Dados da fatura (data de vencimento, valor total)
4. Lista completa de transações
5. Para cada transação, tente identificar a categoria 

## Regras de Extração

### Cartão
- `name`: Nome completo do cartão como aparece na fatura (ex: "Bradesco Visa Infinite", "Inter Mastercard Gold", "Mercado Pago Visa").
- `brand`: Bandeira do cartão: "Visa", "Mastercard", "Elo", "Amex", "Hipercard" ou null se não identificável.
- `last_four_digits`: Últimos 4 dígitos do número do cartão. Procure por padrões como "XXXX XXXX 1234", "final 1234", "**** 1234".
- `closing_day`: Dia do mês em que a fatura fecha (1-31). Extraia da data de fechamento.
- `due_day`: Dia do mês em que a fatura vence (1-31). Extraia da data de vencimento.
- `limit`: Limite total de compras no formato brasileiro "0,00" (string). Procure por "Limite de compras", "Limite total", "Limite disponível".
- `used`: Valor total utilizado no formato brasileiro "0,00" (string).

### Banco
- `bank_name`: Nome do banco emissor (ex: "Bradesco", "Inter", "Mercado Pago", "Nubank", "Itaú").
- `bank_cnpj`: CNPJ do banco se encontrar no documento, senão null.

### Fatura
- `due_date_invoice`: Data de vencimento da fatura no formato "YYYY-MM-DD".
- `total_amount`: Valor total da fatura como número decimal (float). Procure por "Total da fatura", "Total a pagar", "Valor total".

### Transações
Para cada transação, extraia:
- `date`: Data da transação no formato "YYYY-MM-DD". Se o ano não estiver explícito, infira pelo contexto da fatura. Se o mês da transação for maior que o mês de vencimento, assuma o ano anterior.
- `description`: Descrição/estabelecimento exatamente como aparece na fatura.
- `amount`: Valor como número decimal positivo (float). Sempre positivo, mesmo para créditos.
- `is_parcelado`: true se a transação é parcelada (contém padrão como "01/12", "3/6", "parcela").
- `parcela_atual`: Número da parcela atual (int). Se não parcelado, retorne 1.
- `parcela_total`: Total de parcelas (int). Se não parcelado, retorne 1.
- `first_installment_date`: Data da primeira parcela no formato "YYYY-MM-DD".
- `is_income`: true se é um crédito/estorno/devolução (valores negativos na fatura, pagamentos anteriores). false para compras normais.
- `category`: Categoria da transação. Use uma das seguintes: '.$categoriaStr.'.

## O que NÃO extrair como transação
- Totais parciais ("Total para cartão XXXX")
- Resumos de pagamento de faturas anteriores ("Pagto. por Deb em C/C")
- Saldo anterior
- Encargos, multas, IOF (a menos que apareçam como linha individual de lançamento)
- Linhas de cabeçalho ou rodapé
- Ofertas de parcelamento de fatura

## Formato de Resposta
Retorne APENAS o JSON estruturado. Não inclua markdown, comentários ou texto adicional.

PROMPT;
    }



    // /**
    //  * Get the agent's structured output schema definition.
    //  */
    // public function schema(JsonSchema $schema): array
    // {
    //     $transactionSchema = $schema->object([
    //         'date'          => $schema->string(),
    //         'description'   => $schema->string(),
    //         'amount'        => $schema->number(),
    //         'is_parcelado'  => $schema->boolean(),
    //         'parcela_atual' => $schema->integer(),
    //         'parcela_total' => $schema->integer(),
    //         'is_income'     => $schema->boolean(),
    //     ]);

    //     return [
    //         // Dados do Cartão
    //         'name'             => $schema->string(),
    //         'brand'            => $schema->string(),
    //         'last_four_digits' => $schema->string(),
    //         'closing_day'      => $schema->integer(),
    //         'due_day'          => $schema->integer(),
    //         'limit'            => $schema->string(),
    //         'used'             => $schema->string(),

    //         // Dados do Banco
    //         'bank_name' => $schema->string(),
    //         'bank_cnpj' => $schema->string(),

    //         // Dados da Fatura
    //         'due_date_invoice' => $schema->string(),
    //         'total_amount'     => $schema->number(),

    //         // Transações
    //         'transactions' => $schema->array()->items($transactionSchema)->required(),
    //     ];
    // }
}
