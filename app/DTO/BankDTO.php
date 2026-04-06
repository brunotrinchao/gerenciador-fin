<?php

namespace App\DTO;

readonly class BankDTO
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public string $name,
        public ?string $cnpj = null,
    )
    {
        
    }
}
