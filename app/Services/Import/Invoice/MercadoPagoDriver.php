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
        preg_match('/Limite total\s*R\$\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        preg_match('/Total a pagar\s*R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        preg_match('/Limite utilizado\s*R\$\s*([\d\.]+,\d{2})/i', $text, $usageMatch);

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1]) : $dueDate->copy()->subDays(5);
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
            name: 'Mercado Pago',
            cnpj: null,
        );
        $card= new CardDTO(
            name: self::CARDNAME,
            brand: $this->detectBrand($text) ?? 'Visa',
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
        // Dividimos o texto por seções de cartão para ignorar o "Movimentações na fatura" (pagamento anterior)
        $sections = preg_split('/Cartão Visa \[/i', $text);
        
        // Removemos a primeira parte (que contém o cabeçalho e pagamentos anteriores)
        array_shift($sections);
        
        $allTransactions = collect();
        $pattern = '/(\d{2}\/\d{2})(.*?)(?:Parcela\s+(\d+)\s+de\s+(\d+))?\s*R\$\s*([\d\.]*,\d{2})/i';
        $blacklist = [
            'emitido em', 'vence em', 'limite total', 'total a pagar', 'saque total', 
            'pagamento mínimo', 'fatura de', 'consumos de', 'vencimento:', 
            'detalhes de consumo', 'próximo fechamento', 'parcele a fatura', 
            'opções de parcelamento', '1 + ', 'entrada para efetivar'
        ];

        foreach ($sections as $section) {
            preg_match_all($pattern, $section, $matches, PREG_SET_ORDER);

            foreach ($matches as $t) {
                $desc = strtolower($t[2]);
                $skip = false;
                foreach ($blacklist as $item) {
                    if (str_contains($desc, $item)) {
                        $skip = true;
                        break;
                    }
                }
                if ($skip || str_contains($desc, 'pagamento da fatura')) continue;

                $description = trim(preg_replace('/\s+/', ' ', $t[2]));
                $amount = $this->parseMoney($t[5]);
                $date = Carbon::createFromFormat('d/m', $t[1]);

                if ($date->month > now()->month) {
                    $date->subYear();
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
