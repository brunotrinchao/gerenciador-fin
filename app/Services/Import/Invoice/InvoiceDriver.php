<?php

namespace App\Services\Import\Invoice;

use App\DTO\ImportedInvoiceDTO;

interface InvoiceDriver
{
    public function canParse(string $text): bool;
    public function parse(string $text): ImportedInvoiceDTO;
}
