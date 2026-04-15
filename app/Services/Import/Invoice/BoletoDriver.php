<?php

namespace App\Services\Import\Invoice;

use App\DTO\BankDTO;
use App\DTO\CardDTO;
use App\DTO\ImportedInvoiceDTO;
use App\DTO\InvoiceDTO;
use App\Services\Import\Boleto\BoletoParserFactory;
use App\Services\Import\Invoice\Concerns\HasBrandDetection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BoletoDriver implements InvoiceDriver
{
    use HasBrandDetection;

    public function __construct(protected BoletoParserFactory $factory) {}

    public function canParse(string $text): bool
    {
        return (bool) preg_match(
            '/(?:boleto|vencimento|benefici[aá]rio|linha\s+digit[aá]vel|nosso\s+n[uú]mero|cedente|simples\s+nacional|darf|fgts|arrecada[cç][aã]o)/i',
            $text
        );
    }

    public function parse(string $text): ImportedInvoiceDTO
    {
        $dto = $this->factory->make($text)->parse($text);

        return new ImportedInvoiceDTO(
            invoice: new InvoiceDTO(
                dueDateInvoice: $dto->dueDate ? $dto->dueDate->format('Y-m-d') : now()->format('Y-m-d'),
                totalAmount: $dto->amount,
            ),
            bank: new BankDTO(
                name: 'Boleto',
                cnpj: $dto->cnpj,
            ),
            card: new CardDTO(
                name: $dto->beneficiary,
                brand: $this->detectBrand($text),
            ),
            transactions: collect(),
            totalAmount: $dto->amount,
        );
    }
}
