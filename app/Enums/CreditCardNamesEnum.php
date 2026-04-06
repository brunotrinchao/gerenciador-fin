<?php

namespace App\Enums;

enum CreditCardNamesEnum: string
{
    case PICPAY = 'PicPay Card';
    case MERCADO_PAGO = 'Mercado Pago';
    case INTER = 'Inter';
    case BRADESCO = 'Bradesco';
    case NUBANK = 'Nubank';
    case CAIXA = 'Caixa';
    case SANTANDER = 'Santander';
    case ITAU = 'Itaú';
    case SICREDI = 'Sicredi';
    case SICOOB = 'Sicoob';
    case C6 = 'C6';
    case BTG = 'BTG';
    case XP = 'XP';
}
