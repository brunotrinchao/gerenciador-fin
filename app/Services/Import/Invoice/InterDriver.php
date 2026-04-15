<?php

namespace App\Services\Import\Invoice;

use App\DTO\BankDTO;
use App\DTO\CardDTO;
use App\DTO\ImportedInvoiceDTO;
use App\DTO\InvoiceDTO;
use App\DTO\InvoiceTransactionDTO;
use App\Helpers\MaskHelper;
use App\Services\Import\Invoice\Concerns\HasBrandDetection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class InterDriver implements InvoiceDriver
{
    use HasBrandDetection;

    const CARDNAME = 'Banco Inter Mastercard';

    public function canParse(string $text): bool
    {
        return (bool)preg_match('/Banco\s*Inter/i', $text) || (bool)preg_match('/Olá,\s*.*!\s*A\s*sua\s*fatura\s*chegou!/i', $text);
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        // Normalize line endings
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // Extract Summary Data with flexible regexes
        preg_match('/(?:Data de Vencimento|VENCIMENTO)[\s\r\n]*(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);
        preg_match('/(?:Data de corte|DATA DOCUMENTO|fechamento de sua fatura):?[\s\r\n]*(\d{2}\/\d{2}\/\d{4})/i', $text, $closeMatch);
        preg_match('/CARTÃO[\s\r\n]*(\d{4}\*\*\*\*\d{4})/i', $text, $cardMatch);
        
        // Limits and Usage
        preg_match('/Limite de crédito total[\s\r\n]*R\$\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        preg_match('/Utilizado:[\s\r\n]*R\$\s*([\d\.]+,\d{2})/i', $text, $usageMatch);
        preg_match('/Disponível:[\s\r\n]*R\$\s*([\d\.]+,\d{2})/i', $text, $availableMatch);
        
        // Total Amount (various possible labels)
        preg_match('/(?:Total da sua fatura|VALOR DO DOCUMENTO|VALOR COBRADO|Fatura atual)[\s\r\n]*(?:R\$)?\s*([\d\.]+,\d{2})/i', $text, $totalMatch);

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1]) : $dueDate->copy()->subDays(7);
        $totalAmount = $this->parseMoney($totalMatch[1] ?? '0,00');

        $lastFour = '0000';
        if (isset($cardMatch[1])) {
            $lastFour = substr($cardMatch[1], -4);
        }

        $transactions = $this->parseTransactions($text, $dueDate);

        $calculatedTotal = $transactions->reduce(function ($carry, $t) {
            return $t->isIncome ? $carry - $t->amount : $carry + $t->amount;
        }, 0);

        $invoice = new InvoiceDTO(
            dueDateInvoice: $dueDate,
            totalAmount: $totalAmount,
        );
        
        $bank = new BankDTO(
            name: 'Banco Inter',
            cnpj: null,
        );
        
        $card = new CardDTO(
            name: self::CARDNAME,
            brand: $this->detectBrand($text) ?? 'Mastercard',
            lastFourDigits: $lastFour,
            closingDay: $closingDate->day,
            dueDay: $dueDate->day,
            limit: $this->parseMoney($limitMatch[1] ?? '0,00'),
            used: $this->parseMoney($usageMatch[1] ?? '0,00'),
            availableLimit: isset($availableMatch[1]) ? $this->parseMoney($availableMatch[1]) : null,
        );

        return new ImportedInvoiceDTO($invoice, $bank, $card, $transactions, $totalAmount, abs($totalAmount - (float)$calculatedTotal) < 0.15);
    }

    private function parseTransactions(string $text, Carbon $invoiceDate): Collection
    {
        // 1. Cut the text to avoid "Próxima fatura" section
        $parts = preg_split('/Essas são as compras parceladas/i', $text);
        $parsingText = $parts[0];

        // 2. Pattern: DATA DESCRIÇÃO [BENEFICIÁRIO] VALOR
        // Handling multi-line description by using [\s\S]*? and looking for the separator
        // Fixed: simplified regex for better reliability with Smalot output
        $pattern = '/(\d{2} de [a-z]{3}\.? \d{4})\s+([\s\S]*?)\s+-\s+(?:\+|\-)?\s*R\$\s*([\d\.]+,\d{2})/i';

        preg_match_all($pattern, $parsingText, $matches, PREG_SET_ORDER);

        return collect($matches)->map(function ($t) use ($invoiceDate) {
            $descriptionRaw = trim($t[2]);
            
            // Remove internal newlines/tabs from description
            $descriptionRaw = preg_replace('/\s+/', ' ', $descriptionRaw);
            
            // Blacklist: Payment of invoice and similar
            $blacklist = ['pagto debito automatico', 'pagamento de fatura', 'pagamento efetuado'];
            foreach ($blacklist as $term) {
                if (str_contains(strtolower($descriptionRaw), $term)) {
                    return null;
                }
            }
            
            // Extract installment info: (Parcela XX de YY)
            preg_match('/\(Parcela\s+(\d+)\s+de\s+(\d+)\)/i', $descriptionRaw, $parcelas);
            
            $amount = $this->parseMoney($t[3]);
            $isIncome = str_contains($t[0], '+') || str_contains(strtolower($descriptionRaw), 'pagamento');

            // Normalize transaction date to invoice month/year
            // This ensures it falls into the correct monthly balance in the app
            $originalDate = $this->parseInterDate($t[1]);
            $normalizedDate = $originalDate->copy()->year($invoiceDate->year)->month($invoiceDate->month);

            return new InvoiceTransactionDTO(
                date: $normalizedDate,
                description: trim($descriptionRaw),
                amount: abs($amount),
                isParcelado: !empty($parcelas),
                parcelaAtual: isset($parcelas[1]) ? (int)$parcelas[1] : 1,
                parcelaTotal: isset($parcelas[2]) ? (int)$parcelas[2] : 1,
                firstInstallmentDate: null,
                isIncome: $isIncome
            );
        })->filter()->values();
    }

    private function parseInterDate(string $dateStr): \Illuminate\Support\Carbon
    {
        $months = [
            'jan' => 1, 'fev' => 2, 'mar' => 3, 'abr' => 4, 'mai' => 5, 'jun' => 6,
            'jul' => 7, 'ago' => 8, 'set' => 9, 'out' => 10, 'nov' => 11, 'dez' => 12
        ];

        if (preg_match('/(\d{2}) de ([a-z]{3})\.? (\d{4})/i', $dateStr, $m)) {
            $day = (int)$m[1];
            $month = $months[strtolower($m[2])] ?? 1;
            $year = (int)$m[3];
            return \Illuminate\Support\Carbon::create($year, $month, $day, 0, 0, 0);
        }

        return \Illuminate\Support\Carbon::now();
    }

    private function parseMoney(string $val): float
    {
        $val = str_replace('.', '', $val);
        $val = str_replace(',', '.', $val);
        return (float)$val;
    }
}
