<?php

namespace App\Services\Import\Boleto;

use App\DTO\ParsedBoletoDTO;
use Illuminate\Support\Carbon;

class ComercialBoletoDriver implements BoletoDriverInterface
{
    // Aceita qualquer boleto (fallback)
    public function canParse(string $text): bool
    {
        return true;
    }

    public function parse(string $text): ParsedBoletoDTO
    {
        return new ParsedBoletoDTO(
            beneficiary:  $this->extractBeneficiary($text),
            amount:       $this->extractAmount($text),
            dueDate:      $this->extractDueDate($text),
            cnpj:         $this->extractCnpj($text),
            paymentCode:  $this->extractPaymentCode($text),
            type:         'comercial',
        );
    }

    private function extractBeneficiary(string $text): string
    {
        $patterns = [
            '/benefici[aá]rio[:\s\n]+([^\n\r]{3,100})/i',
            '/cedente[:\s\n]+([^\n\r]{3,100})/i',
            '/favorecido[:\s\n]+([^\n\r]{3,100})/i',
            '/raz[aã]o\s+social[:\s\n]+([^\n\r]{3,100})/i',
            '/nome\s+(?:do\s+)?empresa[:\s\n]+([^\n\r]{3,100})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                $name = trim($m[1]);
                if (strlen($name) > 2 && strlen($name) < 100) {
                    return $name;
                }
            }
        }

        return 'Boleto';
    }

    private function extractAmount(string $text): float
    {
        $patterns = [
            '/valor\s+do\s+documento[:\s]+R?\$?\s*([\d\.]+,\d{2})/i',
            '/valor\s+cobrado[:\s]+R?\$?\s*([\d\.]+,\d{2})/i',
            '/(?:^|\s)valor[:\s]+R?\$?\s*([\d\.]+,\d{2})/im',
            '/R\$\s*([\d\.]+,\d{2})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }

        return 0.0;
    }

    private function extractDueDate(string $text): ?Carbon
    {
        $patterns = [
            '/vencimento[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i',
            '/data\s+de\s+vencimento[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i',
            '/valid[ao]\s+at[eé][:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                try {
                    return Carbon::createFromFormat('d/m/Y', str_replace('-', '/', $m[1]));
                } catch (\Throwable) {
                    continue;
                }
            }
        }

        return null;
    }

    private function extractCnpj(string $text): ?string
    {
        if (preg_match('/CNPJ[:\s]+([\d]{2}\.[\d]{3}\.[\d]{3}\/[\d]{4}-[\d]{2})/i', $text, $m)) {
            return $m[1];
        }
        if (preg_match('/CNPJ[:\s]+([\d]{14})/i', $text, $m)) {
            $d = $m[1];
            return "{$d[0]}{$d[1]}.{$d[2]}{$d[3]}{$d[4]}.{$d[5]}{$d[6]}{$d[7]}/{$d[8]}{$d[9]}{$d[10]}{$d[11]}-{$d[12]}{$d[13]}";
        }
        return null;
    }

    private function extractPaymentCode(string $text): ?string
    {
        $patterns = [
            '/linha\s+digit[aá]vel[:\s]+([\d\s\.]{40,60})/i',
            '/c[oó]digo\s+de\s+barras[:\s]+([\d\s\.]{40,60})/i',
            '/([\d]{5}\.[\d]{5}\s+[\d]{5}\.[\d]{6}\s+[\d]{5}\.[\d]{6}\s+[\d]\s+[\d]{14})/i',
            '/([\d]{47,54})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return preg_replace('/\s+/', ' ', trim($m[1]));
            }
        }

        return null;
    }
}
