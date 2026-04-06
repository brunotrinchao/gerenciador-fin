<?php

namespace App\DTO;

use Illuminate\Support\Carbon;

class ParsedBoletoDTO
{
    public function __construct(
        public readonly string  $beneficiary,
        public readonly float   $amount,
        public readonly ?Carbon $dueDate,
        public readonly ?string $cnpj,
        public readonly ?string $paymentCode,
        public readonly string  $type = 'comercial', // 'arrecadacao' | 'comercial'
    ) {}
}
