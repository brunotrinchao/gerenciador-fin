<?php

namespace App\Services\Import\Invoice\Concerns;

trait HasBrandDetection
{
    /**
     * Tenta detectar a bandeira do cartão de crédito a partir do texto da fatura.
     */
    protected function detectBrand(string $text): ?string
    {
        $text = strtolower($text);

        $brands = [
            'Mastercard'       => ['mastercard'],
            'Visa'             => ['visa'],
            'Elo'              => ['elo'],
            'American Express' => ['american express', 'amex'],
            'Hipercard'        => ['hipercard'],
            'Diners'           => ['diners'],
        ];

        foreach ($brands as $brand => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return $brand;
                }
            }
        }

        return null;
    }
}
