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

class AtacadaoDriver implements InvoiceDriver
{
    use HasBrandDetection;

    const CARDNAME = 'Atacadão Mastercard';

    public function canParse(string $text): bool
    {
        return str_contains($text, 'Banco CSF S.A.') && (str_contains($text, 'ATACADAO') || str_contains($text, 'Atacadão'));
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        // Try multiple patterns for Due Date
        preg_match('/VENCIMENTO\s+(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);
        if (!$dueMatch) {
            preg_match('/R\$\s*[\d\.]+,\d{2}\s+(\d{2}\/\d{2}\/\d{4})\s+R\$\s*[\d\.]+,\d{2}/i', $text, $dueMatch);
        }

        preg_match('/PREVISÃO PARA FECHAMENTO DA PRÓXIMA FATURA\s+(\d{2}\/\d{2}\/\d{4})/i', $text, $closeMatch);
        preg_match('/CARTÃO:\s+\d{6}\*+(\d{4})/i', $text, $cardMatch);
        
        // Try multiple patterns for Limit
        preg_match('/Limite de crédito:\s+R\$\s+([\d\.]+,\d{2})/i', $text, $limitMatch);
        if (!$limitMatch) {
            preg_match('/LIMITE DE CRÉDITO\s+R\$\s+([\d\.]+,\d{2})/i', $text, $limitMatch);
        }
        if (!$limitMatch) {
            preg_match('/R\$\s*[\d\.]+,\d{2}\s+\d{2}\/\d{2}\/\d{4}\s+R\$\s*([\d\.]+,\d{2})/i', $text, $limitMatch);
        }

        preg_match('/TOTAL DA FATURA ATUAL:\s+R\$\s+([\d\.]+,\d{2})/i', $text, $totalMatch);
        if (!$totalMatch) {
            preg_match('/TOTAL DA SUA FATURA\s+VENCIMENTO\s+LIMITE DE CRÉDITO\s+R\$\s*([\d\.]+,\d{2})/i', $text, $totalMatch);
        }

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();
        $closingDate = isset($closeMatch[1]) ? Carbon::createFromFormat('d/m/Y', $closeMatch[1])->subMonth() : $dueDate->copy()->subDays(10);
        $totalAmount = $this->parseMoney($totalMatch[1] ?? '0,00');

        $transactions = $this->parseTransactions($text, $dueDate);
        
        $calculatedTotal = $transactions->reduce(function ($carry, $t) {
            return $t->isIncome ? $carry - $t->amount : $carry + $t->amount;
        }, 0);

        $invoice = new InvoiceDTO(
            dueDateInvoice: $dueDate->format('Y-m-d'),
            totalAmount: $totalAmount,
        );
        $bank = new BankDTO(
            name: 'Atacadão (Banco CSF)',
            cnpj: '08.357.240/0001-50',
        );
        $card = new CardDTO(
            name: self::CARDNAME,
            brand: $this->detectBrand($text) ?? 'Mastercard',
            lastFourDigits: $cardMatch[1] ?? '0000',
            closingDay: $closingDate->day,
            dueDay: $dueDate->day,
            limit: $this->parseMoney($limitMatch[1] ?? '0,00'),
            used: $totalAmount,
            availableLimit: null,
        );

        return new ImportedInvoiceDTO(
            $invoice, 
            $bank, 
            $card, 
            $transactions, 
            $totalAmount, 
            abs($totalAmount - (float)$calculatedTotal) < 1.00 
        );
    }

    private function parseTransactions(string $text, Carbon $dueDate): Collection
    {
        // Extract transaction section
        if (preg_match('/LANÇAMENTOS NO BRASIL(.*?)TOTAL DA FATURA/s', $text, $section)) {
            $text = $section[1];
        }

        $lines = explode("\n", $text);
        $allTransactions = collect();
        
        // Pattern: 20/01 DESCRIPTION 158,62
        $pattern = '/(\d{2}\/\d{2})\s*(.*?)\s+([\d\.]+,\d{2}[-]?)/i';

        foreach ($lines as $line) {
            if (preg_match($pattern, $line, $t)) {
                $descriptionRaw = trim($t[2]);
                $descLower = strtolower($descriptionRaw);
                
                if (str_contains($descLower, 'saldo fatura anterior') || 
                    str_contains($descLower, 'total da fatura') ||
                    strlen($descriptionRaw) < 3) {
                    continue;
                }

                $amountStr = $t[3];
                $isIncome = str_ends_with($amountStr, '-');
                $amount = $this->parseMoney(rtrim($amountStr, '-'));
                
                $date = $dueDate->copy()->startOfMonth();
                try {
                    $day = (int)substr($t[1], 0, 2);
                    $month = (int)substr($t[1], 3, 2);
                    
                    // Se o mês da transação for maior que o mês da fatura, provavelmente é do ano anterior
                    $year = $dueDate->year;
                    if ($month > $dueDate->month && $dueDate->month < 3) {
                        $year--;
                    }
                    
                    $date = Carbon::create($year, $month, $day, 0, 0, 0);
                } catch (\Exception $e) {}

                preg_match('/(\d{1,2})\/(\d{1,2})/', $descriptionRaw, $parcelas);
                $parcelaAtual = isset($parcelas[1]) ? (int)$parcelas[1] : 1;
                $parcelaTotal = isset($parcelas[2]) ? (int)$parcelas[2] : 1;

                $allTransactions->push(new InvoiceTransactionDTO(
                    date: $date,
                    description: trim(preg_replace('/\s+/', ' ', $descriptionRaw)),
                    amount: $amount,
                    isParcelado: !empty($parcelas),
                    parcelaAtual: $parcelaAtual,
                    parcelaTotal: $parcelaTotal,
                    firstInstallmentDate: $date->copy()->subMonths($parcelaAtual - 1),
                    isIncome: $isIncome
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
