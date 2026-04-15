<?php

namespace App\DTO;

readonly class CardDTO
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public string $name,
        public ?string $brand = null,
        public ?string $lastFourDigits = null,
        public ?int $closingDay = null,
        public ?int $dueDay = null,
        public ?float $limit = null,
        public ?float $used = null,
        public ?float $availableLimit = null,
    )
    {
        
    }
}
