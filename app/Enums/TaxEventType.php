<?php

namespace App\Enums;

enum TaxEventType: string
{
    case IPVA  = 'ipva';
    case IPTU  = 'iptu';
    case IRPF  = 'irpf';
    case Other = 'other';

    public function label(): string
    {
        return match($this) {
            self::IPVA  => 'IPVA',
            self::IPTU  => 'IPTU',
            self::IRPF  => 'IRPF',
            self::Other => 'Outro',
        };
    }
}
