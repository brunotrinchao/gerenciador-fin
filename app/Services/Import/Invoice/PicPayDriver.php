<?php

namespace App\Services\Import\Invoice;

use App\DTO\ImportedInvoiceDTO;
use App\DTO\InvoiceTransactionDTO;
use App\Helpers\MaskHelper;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PicPayDriver implements InvoiceDriver
{
    const CARDNAME = 'PicPay Card';

    public function canParse(string $text): bool
    {
        // Uso de case-insensitive para garantir a detecção
        return (bool)preg_match('/PicPay\s*(Bank|Card)/i', $text);
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        // 1. Extração do Cartão (Nome e Final)
        // O modificador 's' permite que o '.' inclua quebras de linha
        preg_match('/Cartão\s+(.*?)\s+Final\s+(\d{4})/is', $text, $cardMatch);

        // 2. Extração do Vencimento (Aceita 'Vencimento:', 'Vencimento ' etc)
        preg_match('/Vencimento\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i', $text, $dueMatch);

        // 3. Extração do Fechamento (Geralmente aparece como "fechamento em" ou perto do vencimento)
        preg_match('/fechamento\s+em\s+(\d{2}\/\d{2})/i', $text, $closeMatch);

        // 4. Extração do Valor Total
        preg_match('/Pagamento\s+fatura\s+R\$\s?([\d\.]+,\d{2})/is', $text, $totalMatch);

        // 5. Extração do Limite (PicPay costuma exibir como "Limite total")
        preg_match('/Limite\s+total\s+R\$\s?([\d\.]+,\d{2})/i', $text, $limitMatch);

        if (preg_match('/Picpay\s*Card\s*final\s*(\d{4})/i', $text, $matches)) {
            $lastFour = $matches[1];
        } // Fallback: Procura apenas por "final" seguido de 4 dígitos em qualquer lugar
        elseif (preg_match('/final\s+(\d{4})/i', $text, $matches)) {
            $lastFour = $matches[1];
        } else {
            $lastFour = '0000'; // Valor padrão caso não encontre
        }

        if (preg_match('/Limite disponível para cada tipo de operação\*\s*Total\s*R\$\s*([\d\.]+,\d{2})/is', $text, $matches)) {
            $limit = $this->parseMoney($matches[1]);
        } else {
            // Caso a frase de cima falhe, tentamos uma busca mais direta apenas pelo Total R$
            // que apareça logo após a seção de limites
            preg_match('/Total\s*R\$\s*([\d\.]+,\d{2})/is', $text, $matches);
            $limit = isset($matches[1]) ? $this->parseMoney($matches[1]) : 0.00;
        }

        if (preg_match('/Total parcelado - próximas faturas\*\s*Valor consolidado das parcelas futuras\s*R\$\s*([\d\.]+,\d{2})/is', $text, $matches)) {
            $used = $this->parseMoney($matches[1]);
        } else {
            // Caso a frase de cima falhe, tentamos uma busca mais direta apenas pelo Total R$
            // que apareça logo após a seção de limites
            preg_match('/Total\s*R\$\s*([\d\.]+,\d{2})/is', $text, $matches);
            $used = isset($matches[1]) ? $this->parseMoney($matches[1]) : 0.00;
        }

        $dueDate = isset($dueMatch[1]) ? Carbon::createFromFormat('d/m/Y', $dueMatch[1]) : now();

        return new ImportedInvoiceDTO(
            name          : self::CARDNAME,
            brand         : null,
            lastFourDigits: $lastFour,
            closingDay    : isset($closeMatch[1]) ? Carbon::createFromFormat('d/m', $closeMatch[1])->day : 5,
            dueDay        : $dueDate->day,
            limit         : $limit,
            used          : $used,
            dueDateInvoice: $dueDate,
            bankName      : 'PicPay',
            bankCnpj      : '09.516.419/0001-75',
            transactions  : $this->parseTransactions($text),
            totalAmount   : $this->parseMoney($totalMatch[1] ?? '0,00')
        );
    }

    private function parseTransactions(string $text): Collection
    {
        // Regex para capturar: DATA (12/10) | DESCRIÇÃO | VALOR (1.234,56)
        // O padrão [^0-9\r\n]+ evita que a descrição "atropele" o valor
        $pattern = '/(\d{2}\/\d{2})(.*?)\t\s*(-?[\d\.]+,\d{2})/i';

        preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);

        return collect($matches)->map(function ($t) {
            $description = trim($t[2]);
            $amount = $this->parseMoney($t[3]);

            // Lógica de detecção de parcelas na descrição (Ex: 01/10)
            preg_match('/(\d{2})\/(\d{2})/', $description, $parcelas);

            $strInstallment = isset($parcelas[1]) ? "{$parcelas[1]}/{$parcelas[2]}" : null;

            return new InvoiceTransactionDTO(
                date                : Carbon::createFromFormat('d/m', $t[1])->setYear(now()->year),
                description         : $description,
                amount              : $amount,
                isParcelado         : !empty($parcelas),
                parcelaAtual        : isset($parcelas[1]) ? (int)$parcelas[1] : 1,
                parcelaTotal        : isset($parcelas[2]) ? (int)$parcelas[2] : 1,
                firstInstallmentDate: null, // Opcional: calcular baseado na parcela atual
                isIncome            : $amount < 0 || str_contains(strtolower($description), 'pagamento')
            );
        });
    }

    private function parseMoney(?string $val): int|string
    {
        return $val;
        // if (!$val) return 0;
        // return MaskHelper::covertStrToInt($val);
    }
}
