<?php

namespace App\Enums;

enum AccountType: string
{
    case Checking = 'checking';
    case Savings = 'savings';
    case Investment = 'investment';
    case Cash = 'cash';
    case Other = 'other';

    public function label(): string
    {
        return match($this) {
            self::Checking => 'Conta Corrente',
            self::Savings => 'Poupança',
            self::Investment => 'Conta Investimento',
            self::Cash => 'Dinheiro',
            self::Other => 'Outro',
        };
    }
}
