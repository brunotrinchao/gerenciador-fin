<?php

namespace App\DTO;

use Illuminate\Support\Carbon;

readonly class InvoiceTransactionDTO
{
    public function __construct(
       public Carbon $date,
        public string $description,
        public float $amount,
        public bool $isParcelado,
        public int $parcelaAtual,
        public int $parcelaTotal,
        public ?Carbon $firstInstallmentDate,
        public bool $isIncome, // Identifica se é um crédito/pagamento de fatura
    )
    {
    }

    public static function fromArray(array $data): self
    {
        $parcela = $data['parcelamento'] ?? [];
        $value = (float) ($data['valor'] ?? 0);

        return new self(
            date: Carbon::parse($data['data']),
            description: $data['estabelecimento'] ?? 'Sem descrição',
            amount: abs($value),
            isParcelado: (bool) ($parcela['is_parcelado'] ?? false),
            parcelaAtual: (int) ($parcela['parcela_atual'] ?? 1),
            parcelaTotal: (int) ($parcela['parcela_total'] ?? 1),
            firstInstallmentDate: isset($parcela['data_primeira_parcela'])
                ? Carbon::parse($parcela['data_primeira_parcela'])
                : null,
            isIncome: $value < 0,
        );
    }

    private function isIncome(float $value): bool
    {
        return $value < 0;
    }
}
