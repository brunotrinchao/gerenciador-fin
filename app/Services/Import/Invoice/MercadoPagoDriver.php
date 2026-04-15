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

class MercadoPagoDriver implements InvoiceDriver
{
    use HasBrandDetection;

    const CARDNAME = 'Mercado Pago Visa';

    public function canParse(string $text): bool
    {
        return (bool)preg_match('/Mercado\s*Pago/i', $text);
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        preg_match('/(?:Vence em|Vencimento:)\s*(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);
        preg_match('/Fechamento da fatura\s*(\d{2}\/\d{2}\/\d{4})/i', $text, $closeMatch);
        preg_match('/Cartão Visa \[\*{12}(\d{4})\]/i', $text, $cardMatch);
        
        // Summary regexes with newline tolerance and multiple labels
        preg_match('/Total a pagar\s*R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        if (!$totalMatch) {
            preg_match('/Resumo da fatura[\s\S]*?Total[\s\S]*?R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        }
        
        preg_match('/Limite total\s*R\$\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        preg_match('/Limite utilizado\s*R\$\s*([\d\.]+,\d{2})/i', $text, $usageMatch);
        preg_match('/Limite disponível\s*R\$\s*([\d\.]+,\d{2})/i', $text, $availableMatch);

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1]) : $dueDate->copy()->subDays(5);
        $totalAmount = $this->parseMoney($totalMatch[1] ?? '0,00');

        $transactions = $this->parseTransactions($text, $dueDate);

        $calculatedTotal = $transactions->reduce(function ($carry, $t) {
            return $t->isIncome ? $carry - $t->amount : $carry + $t->amount;
        }, 0);

        $invoice = new InvoiceDTO(
            dueDateInvoice: $dueDate,
            totalAmount: $totalAmount,
        );
        $bank = new BankDTO(
            name: 'Mercado Pago',
            cnpj: null,
        );
        $card = new CardDTO(
            name: self::CARDNAME,
            brand: $this->detectBrand($text) ?? 'Visa',
            lastFourDigits: substr($cardMatch[1] ?? '0000', -4),
            closingDay: $closingDate->day,
            dueDay: $dueDate->day,
            limit: $this->parseMoney($limitMatch[1] ?? '0,00'),
            used: $this->parseMoney($usageMatch[1] ?? '0,00'),
            availableLimit: isset($availableMatch[1]) ? $this->parseMoney($availableMatch[1]) : null,
        );

        return new ImportedInvoiceDTO($invoice, $bank, $card, $transactions, $totalAmount, abs($totalAmount - (float)$calculatedTotal) < 0.15);
    }

    private function parseTransactions(string $text, Carbon $dueDate): Collection
    {
        // Boundary: Stop before future installments or other irrelevant sections
        $parts = preg_split('/Lançamentos futuros|Opções de parcelamento|Parcele a fatura/i', $text);
        $relevantText = $parts[0];

        // Dividimos o texto por seções de cartão
        $sections = preg_split('/Cartão Visa \[/i', $relevantText);
        array_shift($sections); // Remove head
        
        $allTransactions = collect();
        // Regex adjusted to handle dates stuck to descriptions
        $pattern = '/(\d{2}\/\d{2})(.*?)(?:Parcela\s+(\d+)\s+de\s+(\d+))?\s*R\$\s*([\d\.]*,\d{2})/i';
        $blacklist = [
            'emitido em', 'vence em', 'limite total', 'total a pagar', 'saque total', 
            'pagamento mínimo', 'fatura de', 'consumos de', 'vencimento:', 
            'detalhes de consumo', 'próximo fechamento', 'parcele a fatura', 
            'opções de parcelamento', '1 + ', 'entrada para efetivar', 'total r\$'
        ];

        foreach ($sections as $section) {
            preg_match_all($pattern, $section, $matches, PREG_SET_ORDER);

            foreach ($matches as $t) {
                $descriptionRaw = trim($t[2]);
                $descLower = strtolower($descriptionRaw);
                
                $skip = false;
                foreach ($blacklist as $item) {
                    if (str_contains($descLower, $item)) {
                        $skip = true;
                        break;
                    }
                }
                if ($skip || str_contains($descLower, 'pagamento da fatura') || str_contains($descLower, 'pagamento de fatura')) {
                    continue;
                }

                $description = trim(preg_replace('/\s+/', ' ', $descriptionRaw));
                $amount = $this->parseMoney($t[5]);
                
                // Normalizamos a data para o mês/ano da fatura (conforme regra de negócio)
                $date = $dueDate->copy()->startOfMonth();
                // Tenta preservar o dia original se possível, mas garante o mês/ano do vencimento
                try {
                    $originalDay = (int)substr($t[1], 0, 2);
                    $date->day($originalDay);
                } catch (\Exception $e) {
                    // Fallback to 1st of month if day is invalid
                }

                $allTransactions->push(new InvoiceTransactionDTO(
                    date: $date,
                    description: $description,
                    amount: abs($amount),
                    isParcelado: !empty($t[4]),
                    parcelaAtual: isset($t[3]) ? (int)$t[3] : 1,
                    parcelaTotal: isset($t[4]) ? (int)$t[4] : 1,
                    firstInstallmentDate: null,
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
