<?php

namespace App\Enums;

enum BrazilianBank: string
{
    case BancoDoBrasil    = 'banco_do_brasil';
    case Santander        = 'santander';
    case Caixa            = 'caixa';
    case Bradesco         = 'bradesco';
    case Itau             = 'itau';
    case BtgPactual       = 'btg_pactual';
    case Sicoob           = 'sicoob';
    case Inter            = 'inter';
    case Pan              = 'pan';
    case C6Bank           = 'c6_bank';
    case Nubank           = 'nubank';
    case Neon             = 'neon';
    case Original         = 'original';
    case Safra            = 'safra';
    case Sicredi          = 'sicredi';
    case XP               = 'xp';
    case PicPay           = 'picpay';
    case MercadoPago      = 'mercado_pago';
    case WillBank         = 'will_bank';
    case Bs2              = 'bs2';
    case Modal            = 'modal';
    case Bmg              = 'bmg';
    case Banrisul         = 'banrisul';
    case Bv               = 'bv';
    case Parana           = 'parana';
    case Outro            = 'outro';

    public function label(): string
    {
        return match ($this) {
            self::BancoDoBrasil => 'Banco do Brasil',
            self::Santander     => 'Santander',
            self::Caixa         => 'Caixa Econômica Federal',
            self::Bradesco      => 'Bradesco',
            self::Itau          => 'Itaú Unibanco',
            self::BtgPactual    => 'BTG Pactual',
            self::Sicoob        => 'Sicoob',
            self::Inter         => 'Banco Inter',
            self::Pan           => 'Banco Pan',
            self::C6Bank        => 'C6 Bank',
            self::Nubank        => 'Nubank',
            self::Neon          => 'Neon',
            self::Original      => 'Banco Original',
            self::Safra         => 'Banco Safra',
            self::Sicredi       => 'Sicredi',
            self::XP            => 'XP Investimentos',
            self::PicPay        => 'PicPay',
            self::MercadoPago   => 'Mercado Pago',
            self::WillBank      => 'Will Bank',
            self::Bs2           => 'Banco BS2',
            self::Modal         => 'Banco Modal',
            self::Bmg           => 'BMG',
            self::Banrisul      => 'Banrisul',
            self::Bv            => 'Banco BV',
            self::Parana        => 'Paraná Banco',
            self::Outro         => 'Outro',
        };
    }

    public function code(): string
    {
        return match ($this) {
            self::BancoDoBrasil => '001',
            self::Santander     => '033',
            self::Caixa         => '104',
            self::Bradesco      => '237',
            self::Itau          => '341',
            self::BtgPactual    => '208',
            self::Sicoob        => '756',
            self::Inter         => '077',
            self::Pan           => '623',
            self::C6Bank        => '336',
            self::Nubank        => '260',
            self::Neon          => '735',
            self::Original      => '212',
            self::Safra         => '422',
            self::Sicredi       => '748',
            self::XP            => '102',
            self::PicPay        => '380',
            self::MercadoPago   => '323',
            self::WillBank      => '280',
            self::Bs2           => '218',
            self::Modal         => '746',
            self::Bmg           => '318',
            self::Banrisul      => '041',
            self::Bv            => '413',
            self::Parana        => '254',
            self::Outro         => '000',
        };
    }

    /** Retorna lista ordenada para uso em selects */
    public static function toSelect(): array
    {
        return array_map(
            fn (self $bank) => [
                'value' => $bank->value,
                'label' => $bank->label(),
                'code'  => $bank->code(),
            ],
            self::cases()
        );
    }
}
