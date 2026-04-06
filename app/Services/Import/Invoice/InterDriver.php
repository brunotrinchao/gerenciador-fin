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

class InterDriver implements InvoiceDriver
{
    const CARDNAME = 'Banco Inter Mastercard';

    public function canParse(string $text): bool
    {
        return (bool)preg_match('/Banco\s*Inter/i', $text) || (bool)preg_match('/Olá,\s*.*!\s*A\s*sua\s*fatura\s*chegou!/i', $text);
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        preg_match('/Data de Vencimento\s*(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);
        preg_match('/Data de corte:\s*(\d{2}\/\d{2}\/\d{4})/i', $text, $closeMatch);
        preg_match('/CARTÃO\s*(\d{4}\*\*\*\*\d{4})/i', $text, $cardMatch);
        preg_match('/Limite de crédito total\s*R\$\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        preg_match('/Total da sua fatura\s*R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        preg_match('/Utilizado:\s*R\$\s*([\d\.]+,\d{2})/i', $text, $usageMatch);

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1]) : $dueDate->copy()->subDays(7);
        $totalAmount = $this->parseMoney($totalMatch[1] ?? '0,00');

        $lastFour = '0000';
        if (isset($cardMatch[1])) {
            $lastFour = substr($cardMatch[1], -4);
        }

        $transactions = $this->parseTransactions($text);

        $calculatedTotal = $transactions->reduce(function ($carry, $t) {
            return $t->isIncome ? $carry - $t->amount : $carry + $t->amount;
        }, 0);

        $invoice= new InvoiceDTO(
            dueDateInvoice: $dueDate,
            totalAmount: $totalAmount,
        );
        $bank= new BankDTO(
            name: 'Mercado Pago',
            cnpj: null,
        );
        $card= new CardDTO(
            name: self::CARDNAME,
            brand: 'Visa',
            lastFourDigits: $lastFour,
            closingDay: $closingDate->day,
            dueDay: $dueDate->day,
            limit: $this->parseMoney($limitMatch[1] ?? '0,00'),
            used: $this->parseMoney($usageMatch[1] ?? '0,00'),
        );

        return new ImportedInvoiceDTO($invoice, $bank, $card, $transactions, $totalAmount, abs($totalAmount - (float)$calculatedTotal) < 0.15);
    }

    private function parseTransactions(string $text): Collection
    {
        // Padrão: DATA(DD de mmm. YYYY) DESCRIÇÃO (Pode ter parcelas) BENEFICIÁRIO (Ignorado) VALOR
        // Ex: 14 de jan. 2026 CINTIA BINA DA SILVA (Parcela 02 de 03) - R$ 56,63
        $pattern = '/(\d{2} de [a-z]+\.? \d{4})\s+(.*?)\s+(?:-)\s+(?:\+|\-)?\s*R\$\s*([\d\.]+,\d{2})/i';

        preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);

        return collect($matches)->filter(function ($t) {
            return !str_contains(strtolower($t[2]), 'pagto debito automatico');
        })->map(function ($t) {
            $descriptionRaw = trim($t[2]);
            
            // Extrai parcelas: (Parcela XX de YY)
            preg_match('/\(Parcela\s+(\d+)\s+de\s+(\d+)\)/i', $descriptionRaw, $parcelas);
            
            $description = trim(preg_replace('/\s+/', ' ', $descriptionRaw));
            $amount = $this->parseMoney($t[3]);

            return new InvoiceTransactionDTO(
                date: $this->parseInterDate($t[1]),
                description: $description,
                amount: abs($amount),
                isParcelado: !empty($parcelas),
                parcelaAtual: isset($parcelas[1]) ? (int)$parcelas[1] : 1,
                parcelaTotal: isset($parcelas[2]) ? (int)$parcelas[2] : 1,
                firstInstallmentDate: null,
                isIncome: str_contains($t[0], '+') || str_contains(strtolower($description), 'pagamento')
            );
        });
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
