<?php

namespace App\Services\Import\Boleto;

use App\DTO\ParsedBoletoDTO;
use Illuminate\Support\Carbon;

class ArrecadacaoBoletoDriver implements BoletoDriverInterface
{
    public function canParse(string $text): bool
    {
        return (bool) preg_match(
            '/simples\s+nacional|das\s+|darf|fgts|receita\s+federal|arrecada[cç][aã]o|tributo|imposto\s+de\s+renda|inss|iss\s+|iptu|ipva|guia\s+de\s+recolhimento/i',
            $text
        );
    }

    public function parse(string $text): ParsedBoletoDTO
    {
        return new ParsedBoletoDTO(
            beneficiary:  $this->extractBeneficiary($text),
            amount:       $this->extractAmount($text),
            dueDate:      $this->extractDueDate($text),
            cnpj:         $this->extractContribuinteCnpj($text),
            paymentCode:  $this->extractPaymentCode($text),
            type:         'arrecadacao',
        );
    }

    private function extractBeneficiary(string $text): string
    {
        $patterns = [
            '/secretaria\s+(?:especial\s+)?(?:da\s+)?receita\s+federal[^\n]*/i',
            '/minist[eé]rio\s+da\s+fazenda[^\n]*/i',
            '/caixa\s+econ[oô]mica\s+federal[^\n]*/i',
            '/instituto\s+nacional\s+(?:do\s+seguro\s+social|de\s+previd[eê]ncia)[^\n]*/i',
            '/prefeitura\s+(?:municipal\s+)?de\s+[^\n]{3,60}/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return trim($m[0]);
            }
        }

        // Fallback por tipo de guia
        if (preg_match('/simples\s+nacional|das/i', $text)) return 'Simples Nacional / RFB';
        if (preg_match('/darf/i', $text))                   return 'DARF / Receita Federal';
        if (preg_match('/fgts/i', $text))                   return 'FGTS / Caixa Econômica';
        if (preg_match('/inss/i', $text))                   return 'INSS / Previdência Social';
        if (preg_match('/iptu/i', $text))                   return 'IPTU / Prefeitura';
        if (preg_match('/ipva/i', $text))                   return 'IPVA / DETRAN';

        return 'UNIÃO / Órgão Público';
    }

    private function extractAmount(string $text): float
    {
        $patterns = [
            '/valor\s+(?:total\s+)?(?:a\s+pagar|do\s+documento|principal)[:\s]+R?\$?\s*([\d\.]+,\d{2})/i',
            '/total[:\s]+R?\$?\s*([\d\.]+,\d{2})/i',
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
            '/(?:vencimento|data\s+de\s+vencimento|v[aá]lido\s+at[eé])[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i',
            '/(?:período\s+de\s+apura[cç][aã]o|competência)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i',
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

    private function extractContribuinteCnpj(string $text): ?string
    {
        // Prioriza CNPJ do contribuinte (não o da Receita Federal)
        $patterns = [
            '/(?:cnpj|cpf)\s*(?:do\s*contribuinte|do\s*devedor|do\s*pagador)[:\s]+([\d\.\/\-]{11,20})/i',
            '/contribuinte[:\s]+[^\n]*?([\d]{2}\.[\d]{3}\.[\d]{3}\/[\d]{4}-[\d]{2})/i',
            '/CNPJ[:\s]+([\d]{2}\.[\d]{3}\.[\d]{3}\/[\d]{4}-[\d]{2})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return preg_replace('/[^\d\/\.\-]/', '', trim($m[1]));
            }
        }

        return null;
    }

    private function extractPaymentCode(string $text): ?string
    {
        // Linha digitável: sequência de dígitos e pontos/espaços com 47-54 chars
        $patterns = [
            '/linha\s+digit[aá]vel[:\s]+([\d\s\.]{40,60})/i',
            '/c[oó]digo\s+de\s+barras[:\s]+([\d\s\.]{40,60})/i',
            '/([\d]{5}\.[\d]{5}\s+[\d]{5}\.[\d]{6}\s+[\d]{5}\.[\d]{6}\s+[\d]\s+[\d]{14})/i',
            '/([\d]{10}\s+[\d]{10}\s+[\d]{10}\s+[\d]{20})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return preg_replace('/\s+/', ' ', trim($m[1]));
            }
        }

        return null;
    }
}
