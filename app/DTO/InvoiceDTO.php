<?php

namespace App\DTO;

readonly class InvoiceDTO
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public string $dueDateInvoice,
        public ?float $totalAmount = null,
    )
    {
        //
    }
}
