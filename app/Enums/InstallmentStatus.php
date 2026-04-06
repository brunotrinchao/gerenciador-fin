<?php

namespace App\Enums;

enum InstallmentStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::Active => 'Em andamento',
            self::Completed => 'Concluído',
            self::Cancelled => 'Cancelado',
        };
    }
}
