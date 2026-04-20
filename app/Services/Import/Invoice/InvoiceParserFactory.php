<?php

namespace App\Services\Import\Invoice;

class InvoiceParserFactory
{
    protected array $drivers = [
        AtacadaoDriver::class,
        BoletoDriver::class,
        PicPayDriver::class,
        BradescoDriver::class,
        InterDriver::class,
        MercadoPagoDriver::class,
    ];

    public function make(string $text, array $exclude = []): InvoiceDriver
    {
        foreach ($this->drivers as $driverClass) {
            if (in_array($driverClass, $exclude, true)) {
                continue;
            }
            $driver = app($driverClass);
            if ($driver->canParse($text)) {
                return $driver;
            }
        }

        throw new \Exception("Nenhum driver compatível encontrado para este PDF.");
    }
}
