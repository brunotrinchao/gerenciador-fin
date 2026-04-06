<?php

namespace App\Services\Import\Boleto;

class BoletoParserFactory
{
    protected array $drivers = [
        ArrecadacaoBoletoDriver::class,
        ComercialBoletoDriver::class,
    ];

    public function make(string $text): BoletoDriverInterface
    {
        foreach ($this->drivers as $driverClass) {
            $driver = app($driverClass);
            if ($driver->canParse($text)) {
                return $driver;
            }
        }

        // ComercialBoletoDriver sempre retorna true, então nunca chega aqui
        return app(ComercialBoletoDriver::class);
    }
}
