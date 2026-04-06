<?php

namespace App\Services\Import\Boleto;

use App\DTO\ParsedBoletoDTO;

interface BoletoDriverInterface
{
    public function canParse(string $text): bool;
    public function parse(string $text): ParsedBoletoDTO;
}
