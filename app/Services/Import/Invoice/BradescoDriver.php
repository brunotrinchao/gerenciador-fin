<?php

namespace App\Services\Import\Invoice;

use App\DTO\BankDTO;
use App\DTO\CardDTO;
use App\DTO\ImportedInvoiceDTO;
use App\DTO\InvoiceDTO;
use App\DTO\InvoiceTransactionDTO;
use App\Helpers\MaskHelper;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BradescoDriver implements InvoiceDriver
{
    const CARDNAME = 'Bradesco Visa';

    public function canParse(string $text): bool
    {
        return (bool)preg_match('/Bradesco/i', $text) && (bool)preg_match('/VISA INFINITE/i', $text);
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        preg_match('/Vencimento\s*(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);
        preg_match('/Previsão de fechamento da próxima fatura:(\d{2}\/\d{2}\/\d{4})/i', $text, $closeMatch);
        preg_match('/Número do Cartão\s*\d{4}\s*XXXX\s*XXXX\s*(\d{4})/i', $text, $cardMatch);
        preg_match('/Limite de compras\s*R\$\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        preg_match('/Total da fatura\s*R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        preg_match('/Total Utilizado\s*Disponível em.*?Compras\s*R\$\s*[\d\.]+,\d{2}\s*R\$\s*([\d\.]+,\d{2})\s*R\$\s*([\d\.]+,\d{2})/is', $text, $usageMatch);

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1])->subMonth() : $dueDate->copy()->subDays(10);
        $totalAmount = $this->parseMoney($totalMatch[1] ?? '0,00');

        $transactions = $this->parseTransactions($text);
        
        $calculatedTotal = $transactions->reduce(function ($carry, $t) {
            return $t->isIncome ? $carry - $t->amount : $carry + $t->amount;
        }, 0);

      
        $invoice= new InvoiceDTO(
            dueDateInvoice: $dueDate,
            totalAmount: $totalAmount,
        );
        $bank= new BankDTO(
            name: 'Bradesco',
            cnpj: null,
        );
        $card= new CardDTO(
            name: self::CARDNAME,
            brand: 'Visa',
            lastFourDigits: substr($cardMatch[1] ?? '0000', -4),
            closingDay: $closingDate->day,
            dueDay: $dueDate->day,
            limit: $this->parseMoney($limitMatch[1] ?? '0,00'),
            used: $this->parseMoney($usageMatch[1] ?? '0,00'),
        );

        return new ImportedInvoiceDTO($invoice, $bank, $card, $transactions, $totalAmount, abs($totalAmount - (float)$calculatedTotal) < 0.15);
    }

    private function parseTransactions(string $text): Collection
    {
        // Normalização agressiva: junta linhas que não começam com data
        $normalizedText = preg_replace('/\n(?!\d{2}\/\d{2})/', ' ', $text);

        // Blocos de lançamentos
        $blocks = preg_split('/Histórico\s*de\s*Lançamentos/i', $normalizedText);
        array_shift($blocks); 

        $allTransactions = collect();
        
        // Padrão de transação no texto normalizado:
        $pattern = '/(\d{2}\/\d{2})\s*(.*?)\s+([-]?[\d\.]*,\d{2})/i';

        foreach ($blocks as $block) {
            preg_match_all($pattern, $block, $matches, PREG_SET_ORDER);

            foreach ($matches as $t) {
                $descriptionRaw = trim($t[2]);
                $descLower = strtolower($descriptionRaw);
                
                // Filtros de segurança aprimorados
                if (str_contains($descLower, 'saldo anterior') || 
                    str_contains($descLower, 'pagto. por deb em c/c') ||
                    str_contains($descLower, 'total da fatura') ||
                    str_contains($descLower, 'total para') ||
                    str_contains($descLower, 'total do cartão') ||
                    str_contains($descLower, 'encargos') ||
                    str_contains($descLower, 'multa por atraso') ||
                    str_contains($descLower, 'limite de compras') ||
                    str_contains($descLower, 'limite de saque') ||
                    str_contains($descLower, 'emitido em') ||
                    str_contains($descLower, 'compras r$') ||
                    strlen($descriptionRaw) < 5) {
                    continue;
                }

                preg_match('/(\d{2})\/(\d{2})/', $descriptionRaw, $parcelas);
                
                $description = trim(preg_replace('/\s+/', ' ', $descriptionRaw));
                $amount = $this->parseMoney($t[3]);
                $date = Carbon::createFromFormat('d/m', $t[1]);
                $parcelaAtual = isset($parcelas[1]) ? (int)$parcelas[1] : 1;
                $parcelaTotal = isset($parcelas[2]) ? (int)$parcelas[2] : 1;
                $firstInstallmentDate = $date->copy()->subMonths($parcelaAtual - 1);

                if ($date->month > now()->month) {
                    $date->subYear();
                }

                $allTransactions->push(new InvoiceTransactionDTO(
                    date: $date,
                    description: $description,
                    amount: abs($amount),
                    isParcelado: !empty($parcelas),
                    parcelaAtual: $parcelaAtual,
                    parcelaTotal: $parcelaTotal,
                    firstInstallmentDate: $firstInstallmentDate,
                    isIncome: $amount < 0
                ));
            }
        }

        return $allTransactions;
    }

    private function parseMoney(string $val): float
    {
        $val = str_replace('.', '', $val);
        $val = str_replace(',', '.', $val);
        return (float)$val;
    }
}
