<?php

namespace App\Enums;

enum TransactionType: string
{
    case Income = 'income';
    case Expense = 'expense';
    case CreditCard = 'credit_card';
    case Transfer = 'transfer';
    case InvestmentIn = 'investment_in';
    case InvestmentOut = 'investment_out';

    public function label(): string
    {
        return match($this) {
            self::Income => 'Receita',
            self::Expense => 'Despesa',
            self::CreditCard => 'Cartão de Crédito',
            self::Transfer => 'Transferência',
            self::InvestmentIn => 'Aporte',
            self::InvestmentOut => 'Resgate',
        };
    }

    public function affectsBalance(): bool
    {
        return in_array($this, [self::Income, self::Expense, self::Transfer, self::InvestmentIn, self::InvestmentOut]);
    }
}
