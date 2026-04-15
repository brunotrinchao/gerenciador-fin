<?php

namespace App\Services\Import\Invoice;

use App\DTO\BankDTO;
use App\DTO\CardDTO;
use App\DTO\ImportedInvoiceDTO;
use App\DTO\InvoiceDTO;
use App\DTO\InvoiceTransactionDTO;
use App\Services\Import\Invoice\Concerns\HasBrandDetection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PicPayDriver implements InvoiceDriver
{
    use HasBrandDetection;

    const CARDNAME = 'PicPay Mastercard';

    public function canParse(string $text): bool
    {
        return (bool)preg_match('/PicPay\s*Mastercard/i', $text) || (bool)preg_match('/PicPay\s*Bank/i', $text);
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        // Metadata extraction
        preg_match('/Vencimento:\s+(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);
        preg_match('/Fechamento:\s+(\d{2}\/\d{2}\/\d{4})/i', $text, $closeMatch);
        preg_match('/Total da sua fatura\s*R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        preg_match('/Picpay Card final (\d{4})/i', $text, $cardMatch);
        
        // Limits
        preg_match('/Limite total\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        preg_match('/Limite utilizado\s*([\d\.]+,\d{2})/i', $text, $usageMatch);
        preg_match('/Limite disponível\s*([\d\.]+,\d{2})/i', $text, $availableMatch);

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1]) : $dueDate->copy()->subDays(6);
        $totalAmount = $this->parseMoney($totalMatch[1] ?? '0,00');

        // Limits parsing
        $limit = $this->parseMoney($limitMatch[1] ?? '0,00');
        $used = isset($usageMatch[1]) ? $this->parseMoney($usageMatch[1]) : null;
        $availableLimit = isset($availableMatch[1]) ? $this->parseMoney($availableMatch[1]) : null;

        if ($used === null && $availableLimit !== null && $limit > 0) {
            $used = max(0, $limit - $availableLimit);
        }

        $transactions = $this->parseTransactions($text);

        // Validation
        $calculatedTotal = $transactions->reduce(function ($carry, $t) {
            return $t->isIncome ? $carry - $t->amount : $carry + $t->amount;
        }, 0);

        return new ImportedInvoiceDTO(
            invoice: new InvoiceDTO(
                dueDateInvoice: $dueDate->format('Y-m-d'),
                totalAmount: $totalAmount
            ),
            bank: new BankDTO(
                name: 'PicPay',
                cnpj: '09.516.419/0001-75'
            ),
            card: new CardDTO(
                name: self::CARDNAME,
                brand: $this->detectBrand($text) ?? 'Mastercard',
                lastFourDigits: $cardMatch[1] ?? '0000',
                closingDay: $closingDate->day,
                dueDay: $dueDate->day,
                limit: $limit,
                used: $used,
                availableLimit: $availableLimit
            ),
            transactions: $transactions,
            totalAmount: $totalAmount,
            isValidSum: abs($totalAmount - (float)$calculatedTotal) < 0.05
        );
    }

    private function parseTransactions(string $text): Collection
    {
        $transactions = collect();
        
        // PicPay PDF structure: Data Establishment Valor (R$)
        // Patterns for different sections
        $pattern = '/(\d{2}\/\d{4}|\d{2}\/\d{2})\s+(.*?)\s+(-?[\d\.]+,\d{2})/i';
        
        preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);

        $blacklist = [
            'pagamento de fatura', 'total da fatura', 'pagamento mínimo', 'limite total', 'limite utilizado', 
            'limite disponível', 'vencimento', 'fechamento', 'subtotal', 'total geral',
            'valor consolidado', 'total próximas faturas', 'total financiado', 'total a pagar'
        ];

        foreach ($matches as $match) {
            $dateStr = $match[1];
            $description = trim($match[2]);
            $amountStr = $match[3];

            // Filter noise
            $lowerDesc = strtolower($description);
            $isNoise = false;
            foreach ($blacklist as $item) {
                if (str_contains($lowerDesc, $item)) {
                    $isNoise = true;
                    break;
                }
            }
            if ($isNoise) continue;

            // Date parsing (PicPay uses DD/MM or DD/MM/YYYY in some rows)
            try {
                if (strlen($dateStr) === 5) {
                    $date = Carbon::createFromFormat('d/m', $dateStr);
                } else {
                    $date = Carbon::createFromFormat('d/m/Y', $dateStr);
                }
            } catch (\Exception $e) {
                continue;
            }

            $amount = $this->parseMoney($amountStr);
            $isIncome = $amount < 0 || str_contains($lowerDesc, 'pagamento de fatura') || str_contains($lowerDesc, 'créditos e estornos');

            // Installment detection: "TATPARC06/12" or similar
            preg_match('/(\d{2})\/(\d{2})/', $description, $installMatch);

            $transactions->push(new InvoiceTransactionDTO(
                date: $date,
                description: $description,
                amount: abs($amount),
                isParcelado: !empty($installMatch),
                parcelaAtual: isset($installMatch[1]) ? (int)$installMatch[1] : 1,
                parcelaTotal: isset($installMatch[2]) ? (int)$installMatch[2] : 1,
                firstInstallmentDate: null,
                isIncome: $isIncome
            ));
        }

        return $transactions;
    }

    private function parseMoney(string $val): float
    {
        $val = str_replace('.', '', $val);
        $val = str_replace(',', '.', $val);
        return (float)$val;
    }
}
