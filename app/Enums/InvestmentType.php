<?php

namespace App\Enums;

enum InvestmentType: string
{
    case RendaFixa = 'renda_fixa';
    case RendaVariavel = 'renda_variavel';
    case Crypto = 'crypto';
    case Fundos = 'fundos';
    case Poupanca = 'poupanca';
    case Outros = 'outros';

    public function label(): string
    {
        return match($this) {
            self::RendaFixa => 'Renda Fixa',
            self::RendaVariavel => 'Renda Variável',
            self::Crypto => 'Criptomoedas',
            self::Fundos => 'Fundos',
            self::Poupanca => 'Poupança',
            self::Outros => 'Outros',
        };
    }
}
